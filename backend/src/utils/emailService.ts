import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: `"Accuro Website" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
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
      to: process.env.NOTIFICATION_EMAIL || 'iynubauhsoj@gmail.com',
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
      to: process.env.NOTIFICATION_EMAIL || 'iynubauhsoj@gmail.com',
      subject: `New Meeting Request - ${bookingData.company} (${new Date(bookingData.date).toLocaleDateString()})`,
      html,
    });
  }
}

export default new EmailService();
