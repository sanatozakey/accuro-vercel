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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Name:</strong> ${contactData.name}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${contactData.email}</p>
          <p style="margin: 10px 0;"><strong>Phone:</strong> ${contactData.phone}</p>
          ${contactData.company ? `<p style="margin: 10px 0;"><strong>Company:</strong> ${contactData.company}</p>` : ''}
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #1e3a8a;">Message:</h3>
          <p style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 3px;">
            ${contactData.message}
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>This email was sent from the Accuro website contact form.</p>
          <p>Please respond directly to ${contactData.email}</p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Verify Your Email Address
        </h2>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 10px 0;">Hello ${name},</p>
          <p style="margin: 10px 0;">Thank you for registering with Accuro! Please verify your email address to complete your registration.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 3px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Note:</strong> This verification link will expire in 24 hours.
          </p>
        </div>

        <div style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="background-color: #f9fafb; padding: 10px; border: 1px solid #e5e7eb; border-radius: 3px; word-break: break-all; font-size: 12px;">
            ${verificationUrl}
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>If you didn't create an account with Accuro, please ignore this email.</p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Meeting Request Received - Accuro
        </h2>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 10px 0;">Hello ${bookingData.contactName},</p>
          <p style="margin: 10px 0;">Thank you for scheduling a meeting with Accuro! Your meeting request has been successfully received.</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #1e3a8a; margin-top: 0;">Meeting Details</h3>
          <p style="margin: 10px 0;"><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
          <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 10px 0;"><strong>Time:</strong> ${bookingData.time}</p>
          <p style="margin: 10px 0;"><strong>Location:</strong> ${bookingData.location}</p>
          <p style="margin: 10px 0;"><strong>Product Interest:</strong> ${bookingData.product}</p>
          <p style="margin: 10px 0;"><strong>Purpose:</strong> ${bookingData.purpose}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 3px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Status: Pending Confirmation</strong><br>
            We will review your request and send you a confirmation email within 24 hours.
          </p>
        </div>

        ${bookingData.additionalInfo ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #1e3a8a;">Additional Information:</h3>
            <p style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 3px; white-space: pre-wrap;">
              ${bookingData.additionalInfo}
            </p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>If you have any questions, please don't hesitate to contact us:</p>
          <p>Email: info@accuro.com.ph | Phone: +63 9171507737</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          New Meeting Booking Request
        </h2>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #1e3a8a; margin-top: 0;">Contact Information</h3>
          <p style="margin: 10px 0;"><strong>Name:</strong> ${bookingData.contactName}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${bookingData.contactEmail}</p>
          <p style="margin: 10px 0;"><strong>Phone:</strong> ${bookingData.contactPhone}</p>
          <p style="margin: 10px 0;"><strong>Company:</strong> ${bookingData.company}</p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #1e3a8a; margin-top: 0;">Meeting Details</h3>
          <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 10px 0;"><strong>Time:</strong> ${bookingData.time}</p>
          <p style="margin: 10px 0;"><strong>Location:</strong> ${bookingData.location}</p>
          <p style="margin: 10px 0;"><strong>Product Interest:</strong> ${bookingData.product}</p>
          <p style="margin: 10px 0;"><strong>Purpose:</strong> ${bookingData.purpose}</p>
        </div>

        ${bookingData.additionalInfo ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #1e3a8a;">Additional Information:</h3>
            <p style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 3px;">
              ${bookingData.additionalInfo}
            </p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>This email was sent from the Accuro website booking system.</p>
          <p>Please respond to ${bookingData.contactEmail} to confirm the appointment.</p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Password Reset Request
        </h2>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 10px 0;">Hello ${name},</p>
          <p style="margin: 10px 0;">You recently requested to reset your password for your Accuro account. Click the button below to reset it.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>

        <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 3px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Security Notice:</strong> This password reset link will expire in 1 hour for security reasons.
          </p>
        </div>

        <div style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="background-color: #f9fafb; padding: 10px; border: 1px solid #e5e7eb; border-radius: 3px; word-break: break-all; font-size: 12px;">
            ${resetUrl}
          </p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 3px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Did not request this?</strong><br>
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>For security reasons, this link will expire after one use or in 1 hour.</p>
          <p>If you need assistance, please contact us at info@accuro.com.ph</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Accuro',
      html,
    });
  }

  // Send bulk email to multiple recipients (sequential with delay to respect Gmail rate limits)
  async sendBulkEmail(recipients: { email: string; name: string }[], subject: string, htmlContent: string): Promise<{ sent: number; failed: number; errors: string[] }> {
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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                ${personalizedHtml}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                  <p>This email was sent from Accuro.</p>
                  <p>If you wish to unsubscribe, please contact us at info@accuro.com.ph</p>
                </div>
              </div>
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

      // Delay between batches to respect Gmail API rate limits
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

export default new EmailService();
