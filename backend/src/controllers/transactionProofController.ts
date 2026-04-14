import { Request, Response } from 'express';
import TransactionProof from '../models/TransactionProof';
import Booking from '../models/Booking';
import Quotation from '../models/Quotation';
import Product from '../models/Product';

interface AuthRequest extends Request {
  user?: any;
}

// @desc    Get transaction proof by booking ID
// @route   GET /api/transaction-proofs/booking/:bookingId
// @access  Private
export const getTransactionProofByBooking = async (req: AuthRequest, res: Response) => {
  try {
    const proof = await TransactionProof.findOne({ bookingId: req.params.bookingId })
      .populate('quotationId', 'quotationNumber')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Transaction proof not found for this booking',
      });
    }

    res.status(200).json({ success: true, data: proof });
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

    res.status(200).json({ success: true, count: proofs.length, data: proofs });
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

    res.status(200).json({ success: true, count: proofs.length, data: proofs });
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

    // Handle file uploads
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one file is required' });
    }

    const attachments = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: new Date(),
    }));

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

    res.status(200).json({ success: true, data: proof });
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

    if (proof.status !== 'pending_review') {
      return res.status(400).json({ success: false, message: 'Only pending_review proofs can be approved' });
    }

    // Update proof status
    proof.status = 'approved';
    proof.reviewedBy = req.user!._id;
    proof.reviewedByName = req.user!.name;
    proof.reviewedAt = new Date();
    proof.reviewFeedback = req.body.reviewFeedback || '';

    // Deduct inventory
    const lowStockWarnings: string[] = [];
    for (const item of proof.items) {
      if (!item.productId) continue;

      const product = await Product.findById(item.productId);
      if (!product || !product.trackInventory) continue;

      product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
      await product.save();

      if (product.stockQuantity <= product.lowStockThreshold) {
        lowStockWarnings.push(`${product.name}: ${product.stockQuantity} remaining (threshold: ${product.lowStockThreshold})`);
      }
    }

    proof.inventoryDeducted = true;
    proof.inventoryDeductedAt = new Date();
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
      lowStockWarnings: lowStockWarnings.length > 0 ? lowStockWarnings : undefined,
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

    if (proof.status !== 'pending_review') {
      return res.status(400).json({ success: false, message: 'Only pending_review proofs can be rejected' });
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

    const attachments = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: new Date(),
    }));

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

    res.status(200).json({ success: true, data: proof });
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
