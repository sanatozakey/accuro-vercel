# Deployment Instructions for Accuro

## Issue Found
Your Vercel deployment is failing because the **backend API URL is not configured**. The frontend is trying to call `localhost:5000` which doesn't exist in production.

## Quick Fix - Option 1: Deploy Backend to Render (Recommended)

### Step 1: Deploy Backend to Render
1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `sanatozakey/accuro-vercel`
4. Configure:
   - **Name**: `accuro-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

5. Add Environment Variables in Render:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://sanatozakey_db_user:!Passwordnijuswa69@cluster0.pqufhol.mongodb.net/accuro-db?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=accuro_secret_key_2025_change_in_production_123456789
   JWT_EXPIRE=24h
   JWT_REFRESH_EXPIRE=7d
   EMAIL_USER=calibrex.emailer@gmail.com
   EMAIL_PASSWORD=crft vnfm idlf tdoh
   NOTIFICATION_EMAIL=qjmnbunyi@tip.edu.ph
   FRONTEND_URL=https://accuro-vercel-sfom.vercel.app
   CORS_ORIGIN=https://accuro-vercel-sfom.vercel.app
   ADMIN_EMAIL=admin@accuro.com.ph
   ADMIN_PASSWORD=AdminPassword123!
   ADMIN_NAME=Admin User
   ```

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://accuro-backend.onrender.com`)

### Step 2: Configure Vercel Frontend
1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project `accuro-vercel-sfom`
3. Go to "Settings" → "Environment Variables"
4. Add new variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://accuro-backend.onrender.com/api` (use your actual Render URL)
   - **Environment**: Production, Preview, Development

5. Go to "Deployments" tab
6. Click on the latest deployment
7. Click "Redeploy" button

## Quick Fix - Option 2: Use Backend Proxy in Vercel

If you want to keep everything in Vercel:

1. Update `.env` in `my-accuro-website`:
   ```
   REACT_APP_API_URL=/api
   ```

2. Create `vercel.json` in root (already created by Claude)

3. Deploy backend as separate Vercel project or use serverless functions

## Immediate Workaround for Testing

For now, to test locally with the deployed frontend:

1. In Vercel Environment Variables, set:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

2. Run backend locally: `cd backend && npm start`

3. This will only work when testing locally

## What the Console Errors Mean

```
Failed to load resource: accuro-vercel.vercel../my-purchases:1 404
Failed to load resource: accuro-vercel.vercel../activity-logs/my:1 404
```

These errors show that:
- The API base URL is not set (`accuro-vercel.vercel..` is malformed)
- Frontend is trying to call relative URLs without the backend
- You need to configure `REACT_APP_API_URL` environment variable in Vercel

## Recommended Architecture

```
Frontend (Vercel)
    ↓ HTTPS
Backend (Render.com)
    ↓ MongoDB Atlas
Database
```

## After Deployment

Once you've deployed the backend and configured Vercel:

1. Test the APIs:
   - `https://your-backend-url.onrender.com/api/health`
   - Should return: `{ "status": "ok" }`

2. Redeploy Vercel frontend

3. Test the website:
   - Login should work
   - Analytics should load
   - Reports should load
   - No 404 errors

## Need Help?

If you encounter issues:
1. Check Render logs for backend errors
2. Check Vercel logs for frontend build errors
3. Verify environment variables are set correctly
4. Ensure CORS is configured to allow your Vercel domain

---

**STATUS: Backend needs to be deployed first before frontend will work properly.**
