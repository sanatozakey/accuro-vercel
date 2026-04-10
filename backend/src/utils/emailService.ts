// Gmail REST API email service (uses HTTPS, not SMTP)
// This bypasses Render's free tier SMTP port blocking (ports 25, 465, 587)

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const EMAIL_USER = process.env.EMAIL_USER || 'calibrex.emailer@gmail.com';
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';
const FROM_EMAIL = process.env.EMAIL_FROM || `Accuro <${EMAIL_USER}>`;
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || EMAIL_USER;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || EMAIL_USER;

class EmailService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Shared professional email header
  private emailHeader(title: string): string {
    return `
      <div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 32px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">ACCURO</h1>
          <p style="margin: 4px 0 0; color: #bfdbfe; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Beamex Instrumentation &amp; Calibration</p>
        </div>
        <!-- Title Bar -->
        <div style="background-color: #f0f4ff; padding: 16px 32px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; color: #1e3a8a; font-size: 18px; font-weight: 600;">${title}</h2>
        </div>
        <!-- Body -->
        <div style="padding: 28px 32px;">
    `;
  }

  // Shared professional email footer
  private emailFooter(): string {
    return `
        </div>
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; color: #6b7280;">
            <tr>
              <td>
                <p style="margin: 0 0 4px; font-weight: 600; color: #374151;">Accuro</p>
                <p style="margin: 0 0 2px;">Beamex Instrumentation &amp; Calibration</p>
                <p style="margin: 0 0 2px;">Email: <a href="mailto:calibrex.emailer@gmail.com" style="color: #2563eb; text-decoration: none;">calibrex.emailer@gmail.com</a></p>
                <p style="margin: 0;">Phone: +63 917 150 7737</p>
              </td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">This is an automated message from Accuro. Please do not reply directly to this email.</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #9ca3af;">&copy; ${new Date().getFullYear()} Accuro. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;
  }

  private async getAccessToken(): Promise<string> {
    // Reuse cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        refresh_token: GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json() as { access_token: string; expires_in: number; error?: string; error_description?: string };
    if (!response.ok) {
      throw new Error(`OAuth2 token error: ${data.error_description || data.error}`);
    }

    this.accessToken = data.access_token;
    // Expire 60s early to avoid edge cases
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return data.access_token;
  }

  private createMimeMessage(to: string, subject: string, html: string): string {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const message = [
      `From: ${FROM_EMAIL}`,
      `To: ${to}`,
      `Reply-To: ${REPLY_TO_EMAIL}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(html).toString('base64'),
      `--${boundary}--`,
    ].join('\r\n');

    // Gmail API requires URL-safe base64
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (!GMAIL_REFRESH_TOKEN) {
        console.warn('GMAIL_REFRESH_TOKEN not set — skipping email send to', options.to);
        return;
      }

      const accessToken = await this.getAccessToken();
      const raw = this.createMimeMessage(options.to, options.subject, options.html);

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        }
      );

      if (!response.ok) {
        const error = await response.json() as { error?: { message?: string } };
        throw new Error(`Gmail API error: ${error.error?.message || JSON.stringify(error)}`);
      }

      console.log(`Email sent successfully to ${options.to}`);
    } catch (err) {
      console.error('Error sending email:', err);
      throw err;
    }
  }

  // Send contact form notification
  async sendContactNotification(contactData: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    message: string;
  }): Promise<void> {
    const html = `
      ${this.emailHeader('New Contact Form Submission')}
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px;">
          <tr><td style="padding: 14px 18px; border-bottom: 1px solid #e5e7eb;"><strong style="color: #374151;">Name:</strong> <span style="color: #1f2937;">${contactData.name}</span></td></tr>
          <tr><td style="padding: 14px 18px; border-bottom: 1px solid #e5e7eb;"><strong style="color: #374151;">Email:</strong> <a href="mailto:${contactData.email}" style="color: #2563eb;">${contactData.email}</a></td></tr>
          <tr><td style="padding: 14px 18px; border-bottom: 1px solid #e5e7eb;"><strong style="color: #374151;">Phone:</strong> <span style="color: #1f2937;">${contactData.phone}</span></td></tr>
          ${contactData.company ? `<tr><td style="padding: 14px 18px; border-bottom: 1px solid #e5e7eb;"><strong style="color: #374151;">Company:</strong> <span style="color: #1f2937;">${contactData.company}</span></td></tr>` : ''}
        </table>

        <h3 style="color: #1e3a8a; font-size: 15px; margin: 0 0 8px;">Message</h3>
        <div style="background-color: #f9fafb; padding: 16px; border-left: 4px solid #2563eb; border-radius: 4px; color: #374151; line-height: 1.6;">
          ${contactData.message}
        </div>

        <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
          Please respond directly to <a href="mailto:${contactData.email}" style="color: #2563eb;">${contactData.email}</a>.
        </p>
      ${this.emailFooter()}
    `;

    await this.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Contact Form Submission from ${contactData.name}`,
      html,
    });
  }

  // Send email verification
  async sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const html = `
      ${this.emailHeader('Verify Your Email Address')}
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">Hello ${name},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Thank you for registering with Accuro. Please verify your email address by clicking the button below to complete your account setup.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${verificationUrl}" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">
            Verify Email Address
          </a>
        </div>

        <div style="background-color: #fffbeb; padding: 14px 16px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">
            <strong>Note:</strong> This verification link will expire in 24 hours.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin: 16px 0 6px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <div style="background-color: #f1f5f9; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 4px; word-break: break-all; font-size: 12px; color: #475569; font-family: monospace;">
          ${verificationUrl}
        </div>

        <p style="margin-top: 24px; font-size: 13px; color: #9ca3af;">
          If you didn't create an account with Accuro, you can safely ignore this email.
        </p>
      ${this.emailFooter()}
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - Accuro',
      html,
    });
  }

  // Send booking confirmation to customer
  async sendBookingConfirmation(bookingData: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    company: string;
    date: string;
    time: string;
    purpose: string;
    location: string;
    product: string;
    additionalInfo?: string;
    bookingId: string;
  }): Promise<void> {
    const html = `
      ${this.emailHeader('Meeting Request Received')}
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">Hello ${bookingData.contactName},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Thank you for scheduling a meeting with Accuro. Your meeting request has been successfully received and is now being reviewed.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px;">
          <tr><td colspan="2" style="padding: 14px 18px; background-color: #eff6ff; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1e3a8a; font-size: 14px;">Meeting Details</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; width: 140px; color: #6b7280; font-size: 13px;">Booking ID</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px; font-family: monospace;">${bookingData.bookingId}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Date</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${new Date(bookingData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Time</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${bookingData.time}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Location</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${bookingData.location}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Product</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${bookingData.product}</td></tr>
          <tr><td style="padding: 12px 18px; color: #6b7280; font-size: 13px;">Purpose</td><td style="padding: 12px 18px; color: #1f2937; font-size: 13px;">${bookingData.purpose}</td></tr>
        </table>

        <div style="background-color: #fffbeb; padding: 14px 16px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">
            <strong>Status: Pending Confirmation</strong><br>
            Our team will review your request and send you a confirmation within 24 hours.
          </p>
        </div>

        ${bookingData.additionalInfo ? `
          <h3 style="color: #1e3a8a; font-size: 14px; margin: 20px 0 8px;">Additional Information</h3>
          <div style="background-color: #f1f5f9; padding: 14px 16px; border-left: 4px solid #2563eb; border-radius: 4px; color: #374151; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">
            ${bookingData.additionalInfo}
          </div>
        ` : ''}
      ${this.emailFooter()}
    `;

    await this.sendEmail({
      to: bookingData.contactEmail,
      subject: `Meeting Request Confirmation - ${new Date(bookingData.date).toLocaleDateString()}`,
      html,
    });
  }

  // Send booking notification to admin
  async sendBookingNotification(bookingData: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    company: string;
    date: string;
    time: string;
    purpose: string;
    location: string;
    product: string;
    additionalInfo?: string;
  }): Promise<void> {
    const html = `
      ${this.emailHeader('New Meeting Booking Request')}
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px;">
          <tr><td colspan="2" style="padding: 14px 18px; background-color: #f0f4ff; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1e3a8a; font-size: 14px;">Contact Information</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; width: 120px; color: #6b7280; font-size: 13px;">Name</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${bookingData.contactName}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Email</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;"><a href="mailto:${bookingData.contactEmail}" style="color: #2563eb;">${bookingData.contactEmail}</a></td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Phone</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${bookingData.contactPhone}</td></tr>
          <tr><td style="padding: 12px 18px; color: #6b7280; font-size: 13px;">Company</td><td style="padding: 12px 18px; color: #1f2937; font-size: 13px;">${bookingData.company}</td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px;">
          <tr><td colspan="2" style="padding: 14px 18px; background-color: #eff6ff; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1e3a8a; font-size: 14px;">Meeting Details</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; width: 120px; color: #6b7280; font-size: 13px;">Date</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${new Date(bookingData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Time</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${bookingData.time}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Location</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${bookingData.location}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Product</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${bookingData.product}</td></tr>
          <tr><td style="padding: 12px 18px; color: #6b7280; font-size: 13px;">Purpose</td><td style="padding: 12px 18px; color: #1f2937; font-size: 13px;">${bookingData.purpose}</td></tr>
        </table>

        ${bookingData.additionalInfo ? `
          <h3 style="color: #1e3a8a; font-size: 14px; margin: 20px 0 8px;">Additional Information</h3>
          <div style="background-color: #f1f5f9; padding: 14px 16px; border-left: 4px solid #2563eb; border-radius: 4px; color: #374151; font-size: 13px; line-height: 1.6;">
            ${bookingData.additionalInfo}
          </div>
        ` : ''}

        <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
          Please respond to <a href="mailto:${bookingData.contactEmail}" style="color: #2563eb;">${bookingData.contactEmail}</a> to confirm the appointment.
        </p>
      ${this.emailFooter()}
    `;

    await this.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Meeting Request - ${bookingData.company} (${new Date(bookingData.date).toLocaleDateString()})`,
      html,
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const html = `
      ${this.emailHeader('Password Reset Request')}
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">Hello ${name},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          You recently requested to reset your password for your Accuro account. Click the button below to set a new password.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">
            Reset Password
          </a>
        </div>

        <div style="background-color: #fef2f2; padding: 14px 16px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b; font-size: 13px;">
            <strong>Security Notice:</strong> This link will expire after one use or in 1 hour.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin: 16px 0 6px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <div style="background-color: #f1f5f9; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 4px; word-break: break-all; font-size: 12px; color: #475569; font-family: monospace;">
          ${resetUrl}
        </div>

        <div style="background-color: #fffbeb; padding: 14px 16px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">
            <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
      ${this.emailFooter()}
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Accuro',
      html,
    });
  }

  // Send quotation submission confirmation to customer
  async sendQuotationSubmission(quotationData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    company: string;
    quotationNumber: string;
    currency: string;
    items: { productName: string; quantity: number; specifications?: string }[];
    additionalRequirements?: string;
    submittedAt: Date;
  }): Promise<void> {
    const currencySymbol = quotationData.currency === 'USD' ? '$' : '₱';

    const itemRows = quotationData.items
      .map(
        (item, index) => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #374151; font-size: 13px;">${index + 1}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px; font-weight: 500;">${item.productName}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #374151; font-size: 13px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #374151; font-size: 13px;">${item.specifications || '—'}</td>
        </tr>`
      )
      .join('');

    const html = `
      ${this.emailHeader('Quotation Request Submitted')}
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">Hello ${quotationData.customerName},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Thank you for submitting a quotation request with Accuro. Your request has been received and our team will review it shortly.
        </p>

        <!-- Quotation Info -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px;">
          <tr><td colspan="2" style="padding: 14px 18px; background-color: #eff6ff; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1e3a8a; font-size: 14px;">Quotation Details</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; width: 160px; color: #6b7280; font-size: 13px;">Quotation Number</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px; font-family: monospace; font-weight: 600;">${quotationData.quotationNumber}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Company</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${quotationData.company}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Contact</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${quotationData.customerName} &middot; ${quotationData.customerPhone}</td></tr>
          <tr><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #6b7280; font-size: 13px;">Currency</td><td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #1f2937; font-size: 13px;">${quotationData.currency}</td></tr>
          <tr><td style="padding: 12px 18px; color: #6b7280; font-size: 13px;">Date Submitted</td><td style="padding: 12px 18px; color: #1f2937; font-size: 13px;">${quotationData.submittedAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
        </table>

        <!-- Items Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px; border-collapse: collapse;">
          <tr style="background-color: #1e3a8a;">
            <th style="padding: 12px 14px; color: #ffffff; font-size: 12px; text-align: left; font-weight: 600;">#</th>
            <th style="padding: 12px 14px; color: #ffffff; font-size: 12px; text-align: left; font-weight: 600;">Product</th>
            <th style="padding: 12px 14px; color: #ffffff; font-size: 12px; text-align: center; font-weight: 600;">Qty</th>
            <th style="padding: 12px 14px; color: #ffffff; font-size: 12px; text-align: left; font-weight: 600;">Specifications</th>
          </tr>
          ${itemRows}
        </table>

        <p style="color: #374151; font-size: 13px; margin: 0 0 4px;"><strong>Total Items:</strong> ${quotationData.items.length} product(s), ${quotationData.items.reduce((sum, i) => sum + i.quantity, 0)} unit(s)</p>

        ${quotationData.additionalRequirements ? `
          <h3 style="color: #1e3a8a; font-size: 14px; margin: 20px 0 8px;">Additional Requirements</h3>
          <div style="background-color: #f1f5f9; padding: 14px 16px; border-left: 4px solid #2563eb; border-radius: 4px; color: #374151; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${quotationData.additionalRequirements}</div>
        ` : ''}

        <div style="background-color: #eff6ff; padding: 14px 16px; border-left: 4px solid #2563eb; border-radius: 4px; margin: 24px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 13px;">
            <strong>What happens next?</strong><br>
            Our team will review your quotation request and provide you with a formal quote including pricing, payment terms, and delivery timeline. You will receive an email and in-app notification once your quotation has been processed.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-quotations" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">
            Track Your Quotation
          </a>
        </div>
      ${this.emailFooter()}
    `;

    await this.sendEmail({
      to: quotationData.customerEmail,
      subject: `Quotation Request Received - ${quotationData.quotationNumber}`,
      html,
    });
  }

  // Send bulk email to multiple recipients (sequential with delay to respect Gmail rate limits)
  async sendBulkEmail(
    recipients: { email: string; name: string }[],
    subject: string,
    htmlContent: string,
    onProgress?: (progress: { sent: number; failed: number; total: number; currentEmail: string }) => void
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    if (!GMAIL_REFRESH_TOKEN) {
      return {
        sent: 0,
        failed: recipients.length,
        errors: ['Email service is not configured. GMAIL_REFRESH_TOKEN is missing.'],
      };
    }

    const total = recipients.length;

    // Send in batches of 3 with a 1s delay between batches (Gmail rate limit ~2/sec)
    const BATCH_SIZE = 3;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (recipient) => {
          const personalizedHtml = htmlContent.replace(/\{\{name\}\}/g, recipient.name);

          await this.sendEmail({
            to: recipient.email,
            subject,
            html: `
              ${this.emailHeader(subject)}
                <div style="color: #374151; font-size: 15px; line-height: 1.7;">
                  ${personalizedHtml}
                </div>
                <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
                  If you wish to unsubscribe, please contact us at <a href="mailto:calibrex.emailer@gmail.com" style="color: #2563eb;">calibrex.emailer@gmail.com</a>.
                </p>
              ${this.emailFooter()}
            `,
          });

          return recipient.email;
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(result.reason?.message || 'Unknown error');
        }
      }

      // Emit progress after each batch
      if (onProgress) {
        const lastEmail = batch[batch.length - 1]?.email || '';
        onProgress({ sent: results.sent, failed: results.failed, total, currentEmail: lastEmail });
      }

      // Delay between batches to respect Gmail API rate limits
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

export default new EmailService();
