import { Request, Response } from 'express';
import Contact from '../models/Contact';
import emailService from '../utils/emailService';

// @desc    Get all contact messages
// @route   GET /api/contacts
// @access  Private/Admin
export const getContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single contact message
// @route   GET /api/contacts/:id
// @access  Private/Admin
export const getContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    // Mark as read
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create contact message
// @route   POST /api/contacts
// @access  Public
export const createContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.create(req.body);

    // Send email notification
    try {
      await emailService.sendContactNotification({
        name: `${req.body.firstName} ${req.body.lastName}`,
        email: req.body.email,
        phone: req.body.phone,
        company: req.body.company || 'Not provided',
        message: `Subject: ${req.body.subject}\n\n${req.body.message}`,
      });
    } catch (emailError) {
      console.error('Failed to send contact notification email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Your message has been sent successfully! We will get back to you soon.',
    });
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error('=== CONTACT CREATION ERROR ===');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Request Body:', JSON.stringify(req.body, null, 2));

    // Check if it's a Mongoose validation error
    if (error.name === 'ValidationError') {
      console.error('Validation Errors:', JSON.stringify(error.errors, null, 2));

      // Extract specific field errors
      const fieldErrors: Record<string, string> = {};
      for (const field in error.errors) {
        fieldErrors[field] = error.errors[field].message;
      }

      console.error('Field Errors:', JSON.stringify(fieldErrors, null, 2));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: fieldErrors,
      });
    }

    // Log full error object for other errors
    console.error('Full Error Object:', error);
    console.error('Error Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update contact message
// @route   PUT /api/contacts/:id
// @access  Private/Admin
export const updateContact = async (req: Request, res: Response) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
