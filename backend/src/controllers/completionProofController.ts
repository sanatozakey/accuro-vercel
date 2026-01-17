import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import CompletionProof, { IAttachment } from '../models/CompletionProof';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import ActivityLog from '../models/ActivityLog';
import { NotificationService } from '../services/notificationService';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/proofs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// @desc    Create completion proof and complete booking
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

    // Create completion proof
    const completionProof = await CompletionProof.create({
      bookingId,
      serviceReport: parsedServiceReport,
      attachments,
      signature: parsedSignature,
      completedBy: req.user!._id,
      completedByName: req.user!.name,
      completedAt: new Date(),
    });

    // Update booking status to completed
    const previousStatus = booking.status;
    booking.status = 'completed';
    booking.conclusion = parsedServiceReport.workPerformed;
    booking.canReview = true;
    await booking.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'BOOKING_COMPLETED',
        resourceType: 'booking',
        resourceId: booking._id.toString(),
        details: `Booking completed with proof for ${booking.company} (${booking.date.toLocaleDateString()} at ${booking.time}). Work: ${parsedServiceReport.workPerformed.substring(0, 100)}...`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    // Send notification if user exists
    if (booking.userId) {
      try {
        await NotificationService.notifyBookingStatusChange(
          booking.userId,
          booking._id.toString(),
          previousStatus,
          'completed',
          {
            company: booking.company,
            date: booking.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            time: booking.time,
          }
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Booking completed with proof successfully',
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

// @desc    Get completion proof by booking ID
// @route   GET /api/completion-proofs/booking/:bookingId
// @access  Private
export const getCompletionProofByBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const proof = await CompletionProof.findOne({ bookingId })
      .populate('completedBy', 'name email');

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Completion proof not found for this booking',
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

// @desc    Get completion proof by ID
// @route   GET /api/completion-proofs/:id
// @access  Private
export const getCompletionProof = async (req: Request, res: Response) => {
  try {
    const proof = await CompletionProof.findById(req.params.id)
      .populate('completedBy', 'name email')
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
    const { startDate, endDate, completedBy } = req.query;

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

    const proofs = await CompletionProof.find(query)
      .populate('completedBy', 'name email')
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
