import { IUser } from '../models/User';

// Email configuration - In production, use environment variables
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@accuro.com',
  companyName: 'Accuro Calibration Services',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@accuro.com',
  website: process.env.WEBSITE_URL || 'https://accuro.com',
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email template generator functions
export class EmailTemplates {
  // Base template wrapper
  private static wrapTemplate(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
    }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-confirmed { background: #dbeafe; color: #1e40af; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${EMAIL_CONFIG.companyName}</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>${EMAIL_CONFIG.companyName}</p>
    <p>
      <a href="${EMAIL_CONFIG.website}" style="color: #2563eb; text-decoration: none;">Visit our website</a> |
      <a href="mailto:${EMAIL_CONFIG.supportEmail}" style="color: #2563eb; text-decoration: none;">Contact Support</a>
    </p>
    <p style="font-size: 12px; color: #9ca3af;">
      This is an automated email. Please do not reply directly to this message.
    </p>
  </div>
</body>
</html>
    `;
  }

  // Welcome email
  static welcomeEmail(user: IUser): EmailOptions {
    const content = `
      <h2>Welcome to ${EMAIL_CONFIG.companyName}!</h2>
      <p>Dear ${user.name},</p>
      <p>Thank you for creating an account with us. We're excited to have you on board!</p>
      <p>At ${EMAIL_CONFIG.companyName}, we provide professional calibration services and high-quality calibration equipment to ensure your instruments maintain the highest accuracy standards.</p>
      <h3>What you can do next:</h3>
      <ul>
        <li>Browse our calibration equipment catalog</li>
        <li>Schedule a calibration service</li>
        <li>Request product quotations</li>
        <li>Track your service bookings</li>
      </ul>
      <a href="${EMAIL_CONFIG.website}/products" class="button">Browse Products</a>
      <p>If you have any questions, our support team is here to help!</p>
      <p>Best regards,<br>The ${EMAIL_CONFIG.companyName} Team</p>
    `;

    return {
      to: user.email,
      subject: `Welcome to ${EMAIL_CONFIG.companyName}!`,
      html: this.wrapTemplate(content, 'Welcome'),
    };
  }

  // Email verification
  static emailVerification(user: IUser, verificationToken: string): EmailOptions {
    const verificationUrl = `${EMAIL_CONFIG.website}/verify-email?token=${verificationToken}`;

    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Dear ${user.name},</p>
      <p>Thank you for registering with ${EMAIL_CONFIG.companyName}. To complete your registration, please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
      <p>Best regards,<br>The ${EMAIL_CONFIG.companyName} Team</p>
    `;

    return {
      to: user.email,
      subject: 'Verify Your Email Address',
      html: this.wrapTemplate(content, 'Email Verification'),
    };
  }

  // Booking confirmation
  static bookingConfirmation(booking: any): EmailOptions {
    const content = `
      <h2>Booking Confirmed</h2>
      <p>Dear ${booking.customerName},</p>
      <p>Your booking has been confirmed! Here are the details:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p><strong>Service:</strong> ${booking.service}</p>
        <p><strong>Date:</strong> ${new Date(booking.preferredDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Time:</strong> ${booking.preferredTime || 'To be confirmed'}</p>
        <p><strong>Location:</strong> ${booking.location}</p>
        <p><strong>Status:</strong> <span class="status-badge status-confirmed">CONFIRMED</span></p>
      </div>
      <p>Our team will contact you shortly to confirm the exact time and provide any additional information.</p>
      <a href="${EMAIL_CONFIG.website}/dashboard" class="button">View My Bookings</a>
      <p>If you need to make any changes, please contact us at ${EMAIL_CONFIG.supportEmail}</p>
      <p>Best regards,<br>The ${EMAIL_CONFIG.companyName} Team</p>
    `;

    return {
      to: booking.customerEmail,
      subject: `Booking Confirmed - ${booking.service}`,
      html: this.wrapTemplate(content, 'Booking Confirmation'),
    };
  }

  // Quotation approved
  static quotationApproved(quotation: any): EmailOptions {
    const content = `
      <h2>Quotation Approved</h2>
      <p>Dear ${quotation.customerName},</p>
      <p>Great news! Your quotation request has been approved.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p><strong>Quotation Number:</strong> ${quotation.quotationNumber}</p>
        <p><strong>Total Amount:</strong> ${quotation.currency === 'USD' ? '$' : '₱'}${quotation.totalAmount?.toLocaleString()}</p>
        <p><strong>Valid Until:</strong> ${quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
        <p><strong>Status:</strong> <span class="status-badge status-approved">APPROVED</span></p>
      </div>
      ${quotation.paymentTerms ? `<p><strong>Payment Terms:</strong><br>${quotation.paymentTerms}</p>` : ''}
      ${quotation.deliveryTerms ? `<p><strong>Delivery Terms:</strong><br>${quotation.deliveryTerms}</p>` : ''}
      <a href="${EMAIL_CONFIG.website}/quotations" class="button">View Quotation Details</a>
      <p>To proceed with the order, please contact us at ${EMAIL_CONFIG.supportEmail}</p>
      <p>Best regards,<br>The ${EMAIL_CONFIG.companyName} Team</p>
    `;

    return {
      to: quotation.customerEmail,
      subject: `Quotation Approved - ${quotation.quotationNumber}`,
      html: this.wrapTemplate(content, 'Quotation Approved'),
    };
  }

  // Quotation rejected
  static quotationRejected(quotation: any): EmailOptions {
    const content = `
      <h2>Quotation Request Update</h2>
      <p>Dear ${quotation.customerName},</p>
      <p>Thank you for your quotation request #${quotation.quotationNumber}.</p>
      <p>Unfortunately, we are unable to fulfill this request at this time.</p>
      ${quotation.adminNotes ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p><strong>Note from our team:</strong></p>
          <p>${quotation.adminNotes}</p>
        </div>
      ` : ''}
      <p>We appreciate your interest and encourage you to:</p>
      <ul>
        <li>Contact us directly to discuss alternative options</li>
        <li>Browse our current product catalog</li>
        <li>Submit a new quotation request with different specifications</li>
      </ul>
      <a href="${EMAIL_CONFIG.website}/products" class="button">Browse Products</a>
      <p>Our team is here to help! Feel free to reach out at ${EMAIL_CONFIG.supportEmail}</p>
      <p>Best regards,<br>The ${EMAIL_CONFIG.companyName} Team</p>
    `;

    return {
      to: quotation.customerEmail,
      subject: `Quotation Request Update - ${quotation.quotationNumber}`,
      html: this.wrapTemplate(content, 'Quotation Update'),
    };
  }

  // Password reset
  static passwordReset(user: IUser, resetToken: string): EmailOptions {
    const resetUrl = `${EMAIL_CONFIG.website}/reset-password?token=${resetToken}`;

    const content = `
      <h2>Password Reset Request</h2>
      <p>Dear ${user.name},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p><strong>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</strong></p>
      <p>For security reasons, we recommend:</p>
      <ul>
        <li>Using a strong, unique password</li>
        <li>Not sharing your password with anyone</li>
        <li>Changing your password regularly</li>
      </ul>
      <p>Best regards,<br>The ${EMAIL_CONFIG.companyName} Team</p>
    `;

    return {
      to: user.email,
      subject: 'Password Reset Request',
      html: this.wrapTemplate(content, 'Password Reset'),
    };
  }
}

// Email service class - Implement with your preferred email provider
export class EmailService {
  /**
   * Send email using configured email provider
   * To use this service, implement one of the following:
   *
   * 1. SendGrid: npm install @sendgrid/mail
   * 2. AWS SES: npm install @aws-sdk/client-ses
   * 3. Nodemailer: npm install nodemailer
   * 4. Mailgun: npm install mailgun-js
   *
   * Example implementation with SendGrid:
   *
   * import sgMail from '@sendgrid/mail';
   * sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   *
   * await sgMail.send({
   *   from: options.from || EMAIL_CONFIG.from,
   *   to: options.to,
   *   subject: options.subject,
   *   html: options.html,
   *   text: options.text,
   * });
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // TODO: Implement with your preferred email provider
      // For development, log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('\n==================== EMAIL ====================');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`HTML Length: ${options.html.length} characters`);
        console.log('================================================\n');
      }

      // In production, implement actual email sending:
      // Example: await sgMail.send(options);

      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Convenience methods for common email types
  static async sendWelcomeEmail(user: IUser): Promise<boolean> {
    const emailOptions = EmailTemplates.welcomeEmail(user);
    return this.sendEmail(emailOptions);
  }

  static async sendEmailVerification(user: IUser, token: string): Promise<boolean> {
    const emailOptions = EmailTemplates.emailVerification(user, token);
    return this.sendEmail(emailOptions);
  }

  static async sendBookingConfirmation(booking: any): Promise<boolean> {
    const emailOptions = EmailTemplates.bookingConfirmation(booking);
    return this.sendEmail(emailOptions);
  }

  static async sendQuotationApproved(quotation: any): Promise<boolean> {
    const emailOptions = EmailTemplates.quotationApproved(quotation);
    return this.sendEmail(emailOptions);
  }

  static async sendQuotationRejected(quotation: any): Promise<boolean> {
    const emailOptions = EmailTemplates.quotationRejected(quotation);
    return this.sendEmail(emailOptions);
  }

  static async sendPasswordReset(user: IUser, token: string): Promise<boolean> {
    const emailOptions = EmailTemplates.passwordReset(user, token);
    return this.sendEmail(emailOptions);
  }
}
