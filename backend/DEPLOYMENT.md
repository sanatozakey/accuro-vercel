# Accuro Backend Deployment Guide - Render.com

## Prerequisites
- GitHub account with the repository: https://github.com/sanatozakey/accuro-vercel
- Render.com account (free tier available)

## Step 1: Sign Up for Render.com
1. Go to https://render.com
2. Click "Get Started" or "Sign Up"
3. Sign up using your GitHub account (recommended for easier integration)
4. Authorize Render to access your GitHub repositories

## Step 2: Create New Web Service
1. From your Render dashboard, click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository: `sanatozakey/accuro-vercel`
4. Render will scan your repository

## Step 3: Configure Service Settings
Use these exact settings:

**Basic Settings:**
- **Name:** `accuro-backend`
- **Region:** `Singapore` (or closest to your location)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Instance Type:**
- Select **Free** (for testing, can upgrade later)

## Step 4: Configure Environment Variables
Click "Advanced" and add these environment variables from your `.env` file:

```
PORT=5000
NODE_ENV=production

MONGODB_URI=mongodb+srv://sanatozakey_db_user:!Passwordnijuswa69@cluster0.pqufhol.mongodb.net/accuro-db?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=accuro_secret_key_2025_change_in_production_123456789
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

EMAIL_USER=calibrex.emailer@gmail.com
EMAIL_PASSWORD=crft vnfm idlf tdoh
NOTIFICATION_EMAIL=qjmnbunyi@tip.edu.ph

FRONTEND_URL=[Will be updated after deployment]
CORS_ORIGIN=[Will be updated after deployment]

ADMIN_EMAIL=admin@accuro.com.ph
ADMIN_PASSWORD=AdminPassword123!
ADMIN_NAME=Admin User
```

**IMPORTANT:** Copy the values exactly from your `.env` file. After deployment, we'll update FRONTEND_URL and CORS_ORIGIN with the actual Render URL.

## Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Run `npm install && npm run build`
   - Start the server with `npm start`
   - Provide you with a public URL (e.g., https://accuro-backend.onrender.com)

## Step 6: Verify Deployment
Once deployment completes:
1. Copy your Render service URL (e.g., `https://accuro-backend.onrender.com`)
2. Test the API by visiting: `https://your-service-url.onrender.com/api/health`
3. You should see a success response

## Step 7: Update Environment Variables
After getting your Render URL:
1. Go to your Render dashboard
2. Navigate to your `accuro-backend` service
3. Go to "Environment" tab
4. Update these variables:
   - `FRONTEND_URL` → Your Render URL (e.g., https://accuro-backend.onrender.com)
   - `CORS_ORIGIN` → Your Render URL (e.g., https://accuro-backend.onrender.com)
5. Save changes (Render will automatically redeploy)

## Step 8: Update Mobile App
Once backend is deployed, we'll update the mobile app configuration:
- File: `AccuroMobile/src/services/api.ts`
- Replace production URL with your Render backend URL
- Rebuild the APK

## Troubleshooting

### Build Fails
- Check "Logs" tab in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npm run build`

### App Crashes on Start
- Check environment variables are set correctly
- Verify MongoDB connection string is valid
- Check "Logs" tab for error messages

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Upgrade to paid plan ($7/month) for always-on service

## Important Notes
- Free tier has 750 hours/month (sufficient for testing)
- HTTPS is automatically enabled
- Auto-deploys on every push to `main` branch
- Environment variables are encrypted and secure

## Next Steps
After successful deployment:
1. Note your backend URL
2. Update mobile app API configuration
3. Rebuild mobile APK with cloud backend
4. Test mobile app connectivity

---
**Support:** If you encounter issues, check Render's logs or contact support at https://render.com/docs
