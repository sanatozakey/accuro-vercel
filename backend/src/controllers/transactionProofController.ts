import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import mongoose from 'mongoose';
import TransactionProof from '../models/TransactionProof';
import Booking from '../models/Booking';
import Quotation from '../models/Quotation';
import Product from '../models/Product';
import ActivityLog from '../models/ActivityLog';

// Resolve a product from a transaction item. `productId` is stored as a String and
// may be a Mongo ObjectId, a slug (e.g. "logical"), or missing — fall back to name.
const resolveProductFromItem = async (item: { productId?: string; productName?: string }) => {
  const candidates: any[] = [];
  if (item.productId) {
    if (mongoose.Types.ObjectId.isValid(item.productId)) {
      candidates.push({ _id: new mongoose.Types.ObjectId(item.productId) });
    }
    candidates.push({ name: item.productId });
  }
  if (item.productName) {
    candidates.push({ name: item.productName });
  }
  if (candidates.length === 0) return null;
  return Product.findOne({ $or: candidates });
};

interface AuthRequest extends Request {
  user?: any;
}

// Strip fileData from attachments to keep responses small
const stripFileData = (proof: any) => {
  const obj = typeof proof.toObject === 'function' ? proof.toObject() : { ...proof };
  if (obj.attachments) {
    obj.attachments = obj.attachments.map((att: any) => {
      const { fileData, ...rest } = att;
      return rest;
    });
  }
  if (obj.revisionHistory) {
    obj.revisionHistory = obj.revisionHistory.map((rev: any) => {
      if (rev.attachments) {
        rev.attachments = rev.attachments.map((att: any) => {
          const { fileData, ...rest } = att;
          return rest;
        });
      }
      return rev;
    });
  }
  return obj;
};

// @desc    Get transaction proof by booking ID
// @route   GET /api/transaction-proofs/booking/:bookingId
// @access  Private
export const getTransactionProofByBooking = async (req: AuthRequest, res: Response) => {
  try {
    let proof = await TransactionProof.findOne({ bookingId: req.params.bookingId })
      .populate('quotationId', 'quotationNumber')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Transaction proof not found for this booking',
      });
    }

    // Self-heal: if proof is pending_upload but the booking has already had its
    // technician fee marked paid/waived, lift that receipt in so the Review
    // Payment modal can approve & deduct. Handles bookings that got stuck
    // before the auto-lift was added.
    if (proof.status === 'pending_upload') {
      const booking = await Booking.findById(proof.bookingId).select(
        'technicianFee status'
      );
      const fee: any = (booking as any)?.technicianFee;
      if (fee && (fee.status === 'paid' || fee.status === 'waived')) {
        if (fee.status === 'paid' && fee.proofData) {
          const originalName = fee.proofFilename || 'fee-receipt.png';
          const ext = path.extname(originalName) || '.png';
          const uniqueFilename = `${uuidv4()}${ext}`;
          proof.attachments = [
            {
              filename: uniqueFilename,
              originalName,
              mimeType: fee.proofMimeType || 'image/png',
              size: fee.proofData.length,
              path: `uploads/proofs/${uniqueFilename}`,
              fileData: fee.proofData,
              uploadedAt: fee.proofSubmittedAt || new Date(),
            } as any,
          ];
          proof.customerNotes = 'Auto-linked from technician fee receipt';
        } else if (fee.status === 'waived') {
          proof.customerNotes = 'Technician fee waived — no receipt required';
        }
        proof.status = 'pending_review';
        if (req.user?._id) proof.submittedBy = req.user._id;
        proof.submittedAt = new Date();
        await proof.save();
      }
    }

    res.status(200).json({ success: true, data: stripFileData(proof) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all pending review transaction proofs
// @route   GET /api/transaction-proofs/pending-review
// @access  Superadmin
export const getPendingTransactionProofs = async (req: AuthRequest, res: Response) => {
  try {
    const proofs = await TransactionProof.find({ status: 'pending_review' })
      .populate('bookingId', 'company contactName purpose date time')
      .populate('quotationId', 'quotationNumber')
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 });

    res.status(200).json({ success: true, count: proofs.length, data: proofs.map(stripFileData) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all transaction proofs
// @route   GET /api/transaction-proofs
// @access  Admin/Superadmin
export const getAllTransactionProofs = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) query.status = status;

    const proofs = await TransactionProof.find(query)
      .populate('bookingId', 'company contactName purpose date time status')
      .populate('quotationId', 'quotationNumber')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: proofs.length, data: proofs.map(stripFileData) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Customer submits payment proof
// @route   POST /api/transaction-proofs/:id/submit
// @access  Private (booking owner)
export const submitPaymentProof = async (req: AuthRequest, res: Response) => {
  try {
    const proof = await TransactionProof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Transaction proof not found' });
    }

    // Verify ownership via booking
    const booking = await Booking.findById(proof.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Associated booking not found' });
    }

    const isOwner = booking.userId?.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (proof.status !== 'pending_upload' && proof.status !== 'rejected') {
      return res.status(400).json({ success: false, message: `Cannot submit proof when status is ${proof.status}` });
    }

    // Handle file uploads (memory storage — files are in buffer)
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one file is required' });
    }

    const attachments = files.map(file => {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      return {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `uploads/proofs/${uniqueFilename}`,
        fileData: file.buffer,
        uploadedAt: new Date(),
      };
    });

    proof.attachments = attachments;
    proof.customerNotes = req.body.customerNotes || '';
    proof.status = 'pending_review';
    proof.submittedBy = req.user!._id;
    proof.submittedAt = new Date();

    await proof.save();

    // Update booking status
    booking.status = 'payment_submitted';
    booking.statusHistory.push({
      status: 'payment_submitted',
      changedAt: new Date(),
      changedBy: req.user!._id,
      note: 'Payment proof submitted by customer',
    });
    await booking.save();

    // Return proof without fileData to reduce response size
    const proofObj = proof.toObject();
    proofObj.attachments = proofObj.attachments.map((att: any) => {
      const { fileData, ...rest } = att;
      return rest;
    });

    res.status(200).json({ success: true, data: proofObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Superadmin approves transaction proof
// @route   PUT /api/transaction-proofs/:id/approve
// @access  Superadmin
export const approveTransactionProof = async (req: AuthRequest, res: Response) => {
  try {
    const proof = await TransactionProof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Transaction proof not found' });
    }

    // Accept pending_review (normal customer-upload flow) and pending_upload
    // (admin-driven flow where the technician fee receipt doubles as proof and
    // no separate customer upload step occurred).
    if (proof.status !== 'pending_review' && proof.status !== 'pending_upload') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve proof in status ${proof.status}`,
      });
    }

    // Pre-scan inventory: resolve every tracked item, abort if any has insufficient stock.
    // Skipped entirely if this proof already deducted (idempotency — re-approval shouldn't double-deduct).
    type ResolvedItem = {
      item: typeof proof.items[number];
      product: any;
      skipReason?: 'not_found' | 'not_tracked';
    };
    const resolvedItems: ResolvedItem[] = [];
    const shortfall: { productName: string; requested: number; available: number }[] = [];

    if (!proof.inventoryDeducted) {
      for (const item of proof.items) {
        const product = await resolveProductFromItem(item);
        if (!product) {
          resolvedItems.push({ item, product: null, skipReason: 'not_found' });
          continue;
        }
        if (!product.trackInventory) {
          resolvedItems.push({ item, product, skipReason: 'not_tracked' });
          continue;
        }
        if (product.stockQuantity < item.quantity) {
          shortfall.push({
            productName: product.name,
            requested: item.quantity,
            available: product.stockQuantity,
          });
        }
        resolvedItems.push({ item, product });
      }

      if (shortfall.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock to approve — restock or adjust items first',
          shortfall,
        });
      }
    }

    // Update proof status
    proof.status = 'approved';
    proof.reviewedBy = req.user!._id;
    proof.reviewedByName = req.user!.name;
    proof.reviewedAt = new Date();
    proof.reviewFeedback = req.body.reviewFeedback || '';

    // Deduct inventory (idempotent — skip if already deducted)
    const lowStockWarnings: string[] = [];
    const skippedItems: { productName: string; quantity: number; reason: string }[] = [];
    let deductedCount = 0;

    if (!proof.inventoryDeducted) {
      for (const { item, product, skipReason } of resolvedItems) {
        if (skipReason === 'not_found') {
          skippedItems.push({
            productName: item.productName || item.productId || 'Unknown',
            quantity: item.quantity,
            reason: 'Product not found in catalog',
          });
          continue;
        }
        if (skipReason === 'not_tracked') {
          skippedItems.push({
            productName: product.name,
            quantity: item.quantity,
            reason: 'Inventory tracking disabled',
          });
          continue;
        }
        if (!product) continue;

        const previousQty = product.stockQuantity;
        product.stockQuantity = Math.max(0, previousQty - item.quantity);
        await product.save();
        deductedCount++;

        // Per-deduction audit entry
        try {
          await ActivityLog.create({
            user: req.user!._id,
            userName: req.user!.name,
            userEmail: req.user!.email,
            action: 'INVENTORY_DEDUCTED',
            resourceType: 'product',
            resourceId: product._id.toString(),
            details: `Proof ${proof._id}: ${product.name} ${previousQty} → ${product.stockQuantity} (-${item.quantity})`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          });
        } catch (logErr) {
          console.error('Failed to log inventory deduction:', logErr);
        }

        if (product.stockQuantity <= product.lowStockThreshold) {
          lowStockWarnings.push(`${product.name}: ${product.stockQuantity} remaining (threshold: ${product.lowStockThreshold})`);
        }
      }
      proof.inventoryDeducted = true;
      proof.inventoryDeductedAt = new Date();
    }

    await proof.save();

    // Update booking status to verified
    const booking = await Booking.findById(proof.bookingId);
    if (booking) {
      booking.status = 'verified';
      booking.statusHistory.push({
        status: 'verified',
        changedAt: new Date(),
        changedBy: req.user!._id,
        note: 'Transaction verified by superadmin',
      });
      await booking.save();
    }

    res.status(200).json({
      success: true,
      data: proof,
      deductionSummary: {
        totalItems: proof.items.length,
        deducted: deductedCount,
        skipped: skippedItems.length,
      },
      lowStockWarnings: lowStockWarnings.length > 0 ? lowStockWarnings : undefined,
      skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Superadmin rejects transaction proof
// @route   PUT /api/transaction-proofs/:id/reject
// @access  Superadmin
export const rejectTransactionProof = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewFeedback } = req.body;
    if (!reviewFeedback) {
      return res.status(400).json({ success: false, message: 'Review feedback is required when rejecting' });
    }

    const proof = await TransactionProof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Transaction proof not found' });
    }

    // Accept pending_review and pending_upload (see approve for rationale).
    if (proof.status !== 'pending_review' && proof.status !== 'pending_upload') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject proof in status ${proof.status}`,
      });
    }

    // Save current state to revision history
    proof.revisionHistory.push({
      attachments: proof.attachments,
      customerNotes: proof.customerNotes,
      rejectionFeedback: reviewFeedback,
      revisedAt: new Date(),
      revisedBy: req.user!._id,
    } as any);

    proof.status = 'rejected';
    proof.reviewedBy = req.user!._id;
    proof.reviewedByName = req.user!.name;
    proof.reviewedAt = new Date();
    proof.reviewFeedback = reviewFeedback;

    await proof.save();

    // Revert booking status to awaiting_payment
    const booking = await Booking.findById(proof.bookingId);
    if (booking) {
      booking.status = 'awaiting_payment';
      booking.statusHistory.push({
        status: 'awaiting_payment',
        changedAt: new Date(),
        changedBy: req.user!._id,
        note: `Payment proof rejected: ${reviewFeedback}`,
      });
      await booking.save();
    }

    res.status(200).json({ success: true, data: proof });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Customer resubmits after rejection
// @route   PUT /api/transaction-proofs/:id/revise
// @access  Private (booking owner)
export const reviseTransactionProof = async (req: AuthRequest, res: Response) => {
  try {
    const proof = await TransactionProof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Transaction proof not found' });
    }

    if (proof.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected proofs can be revised' });
    }

    // Verify ownership
    const booking = await Booking.findById(proof.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Associated booking not found' });
    }

    const isOwner = booking.userId?.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one file is required' });
    }

    const attachments = files.map(file => {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      return {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `uploads/proofs/${uniqueFilename}`,
        fileData: file.buffer,
        uploadedAt: new Date(),
      };
    });

    proof.attachments = attachments;
    proof.customerNotes = req.body.customerNotes || '';
    proof.status = 'pending_review';
    proof.submittedBy = req.user!._id;
    proof.submittedAt = new Date();
    proof.reviewFeedback = undefined;

    await proof.save();

    // Update booking status
    booking.status = 'payment_submitted';
    booking.statusHistory.push({
      status: 'payment_submitted',
      changedAt: new Date(),
      changedBy: req.user!._id,
      note: 'Revised payment proof submitted',
    });
    await booking.save();

    const proofObj = proof.toObject();
    proofObj.attachments = proofObj.attachments.map((att: any) => {
      const { fileData, ...rest } = att;
      return rest;
    });

    res.status(200).json({ success: true, data: proofObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Admin adjusts items/quantities before approval
// @route   PUT /api/transaction-proofs/:id/adjust-items
// @access  Admin/Superadmin
export const adjustTransactionItems = async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    const proof = await TransactionProof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Transaction proof not found' });
    }

    proof.items = items;
    proof.totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
    await proof.save();

    res.status(200).json({ success: true, data: proof });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Serve attachment file from MongoDB
// @route   GET /api/transaction-proofs/attachment/:proofId/:filename
// @access  Public (file is accessed directly by browser)
export const serveAttachment = async (req: Request, res: Response) => {
  try {
    const { proofId, filename } = req.params;

    const proof = await TransactionProof.findById(proofId).select('attachments revisionHistory');
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Transaction proof not found' });
    }

    // Search in current attachments
    let attachment = proof.attachments.find((att: any) => att.filename === filename);

    // If not found, search in revision history
    if (!attachment) {
      for (const revision of proof.revisionHistory) {
        attachment = revision.attachments.find((att: any) => att.filename === filename);
        if (attachment) break;
      }
    }

    if (!attachment || !(attachment as any).fileData) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    res.set('Content-Type', attachment.mimeType);
    res.set('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    res.set('Content-Length', String((attachment as any).fileData.length));
    res.send((attachment as any).fileData);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
