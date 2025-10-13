# Email Service Setup Guide

This guide will help you set up the email service for your Accuro application. The same Gmail account will be used for:
- Sending email verification codes
- Sending contact form notifications
- Sending booking confirmation emails to customers
- Sending booking notifications to admin

## Prerequisites

- A Gmail account (recommended to create a new one specifically for your application)
- Access to your backend `.env` file

## Step 1: Create or Use an Existing Gmail Account

1. Go to https://gmail.com
2. Either sign in to an existing account or create a new one
3. **Recommended**: Create a dedicated email like `noreply@your-domain.com` or `notifications@your-domain.com`

## Step 2: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", click on **2-Step Verification**
4. Follow the steps to enable 2FA (you'll need your phone)

## Step 3: Generate an App Password

1. After enabling 2FA, go back to: https://myaccount.google.com/security
2. Under "Signing in to Google", click on **App passwords**
   - If you don't see this option, make sure 2FA is enabled first
3. At the bottom, you'll see "Select app" dropdown:
   - Select **Mail**
4. Select "Select device" dropdown:
   - Select **Other (Custom name)**
   - Enter: `Accuro Website`
5. Click **Generate**
6. **IMPORTANT**: Copy the 16-character password that appears
   - It looks like: `xxxx xxxx xxxx xxxx`
   - Remove the spaces, so it becomes: `xxxxxxxxxxxxxxxx`
   - You won't be able to see this password again!

## Step 4: Configure Backend Environment Variables

1. Open your backend `.env` file:
   ```
   C:\Accuro Deployed\calibrex-accuro\backend\.env
   ```

2. Add or update these variables:
   ```env
   # Email Configuration
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   NOTIFICATION_EMAIL=your-email@gmail.com
   FRONTEND_URL=http://localhost:3000
   ```

   **Example:**
   ```env
   EMAIL_USER=accuro.notifications@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   NOTIFICATION_EMAIL=info@accuro.com.ph
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

   **Variable Explanations:**
   - `EMAIL_USER`: The Gmail address that will send all emails
   - `EMAIL_PASSWORD`: The 16-character app password you generated
   - `NOTIFICATION_EMAIL`: Where admin notifications (contact forms, booking requests) will be sent
   - `FRONTEND_URL`: Your frontend URL (needed for email verification links)

## Step 5: Test the Email Service

### Option 1: Test with Contact Form
1. Start your backend server: `cd backend && npm run dev`
2. Start your frontend: `cd my-accuro-website && npm start`
3. Go to the Contact page
4. Fill out and submit the form
5. Check that:
   - You receive a success message
   - An email arrives at your `NOTIFICATION_EMAIL`

### Option 2: Test with User Registration
1. Go to the Signup page
2. Register a new user with a real email address
3. Check your inbox for the verification email
4. Click the verification link

### Option 3: Test with Booking Request
1. Go to the Booking page
2. Submit a meeting request with a real email address
3. Check that:
   - The customer receives a confirmation email
   - The admin receives a notification email

## Troubleshooting

### "Invalid login" or "Authentication failed"
- Make sure 2FA is enabled on your Gmail account
- Double-check that you're using an App Password, not your regular Gmail password
- Remove any spaces from the App Password
- Try generating a new App Password

### Emails not sending
- Check your backend console for error messages
- Verify that `EMAIL_USER` and `EMAIL_PASSWORD` are correctly set in `.env`
- Make sure you restart your backend server after changing `.env`
- Check your Gmail account's "Sent" folder
- Check if Gmail has blocked the app (you'll receive an email about it)

### Emails going to spam
- This is common with new sending accounts
- Ask recipients to mark your emails as "Not Spam"
- Consider using a custom domain email with proper SPF/DKIM records for production

### "Less secure app access" warning
- You should NOT enable "Less secure app access"
- Always use App Passwords with 2FA instead

## Production Considerations

For production environments, consider:

1. **Use a Custom Domain Email**: Instead of `@gmail.com`, use your own domain
   - Example: `noreply@accuro.com.ph`
   - Set up with a service like Google Workspace, SendGrid, or AWS SES

2. **Environment-Specific URLs**: Update `FRONTEND_URL` for production
   ```env
   FRONTEND_URL=https://accuro.vercel.app
   ```

3. **Rate Limits**: Gmail has sending limits (500 emails/day for free accounts)
   - For higher volume, use a dedicated email service

4. **Email Service Providers** (for production):
   - **SendGrid**: Up to 100 emails/day free
   - **Mailgun**: Up to 10,000 emails/month free (first 3 months)
   - **AWS SES**: Very cheap, pay-as-you-go
   - **Google Workspace**: $6/user/month, professional email

## Email Features Implemented

✅ **Email Verification**
- Sent when users register
- 24-hour expiration
- Resend capability

✅ **Contact Form Notifications**
- Admin receives notification when someone submits contact form
- Includes all form details

✅ **Booking Confirmations**
- Customer receives confirmation email with booking details
- Admin receives notification of new booking request
- Includes booking ID, date, time, and all details

✅ **Professional Templates**
- All emails use branded HTML templates
- Mobile-responsive design
- Clear call-to-action buttons

## Questions?

If you encounter any issues:
1. Check the backend console for detailed error messages
2. Verify all `.env` variables are set correctly
3. Make sure your Gmail account has 2FA enabled
4. Try generating a new App Password
