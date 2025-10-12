# Accuro Website - Vercel Deployment Guide

This guide will help you deploy both the frontend and backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Part 1: Deploy Backend to Vercel

### Step 1: Prepare Backend for Deployment

The backend has been configured for Vercel deployment with:
- ✅ `api/index.ts` - Serverless function entry point
- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to ignore during deployment

### Step 2: Deploy Backend

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select the `backend` directory as the root directory
4. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
cd backend
vercel --prod
```

### Step 3: Configure Backend Environment Variables

After deployment, add these environment variables in Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://sanatozakey_db_user:!Passwordnijuswa69@cluster0.pqufhol.mongodb.net/accuro-db?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=accuro_secret_key_2025_change_in_production_123456789
JWT_EXPIRE=7d
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
NOTIFICATION_EMAIL=iynubauhsoj@gmail.com
CORS_ORIGIN=*
ADMIN_EMAIL=admin@accuro.com.ph
ADMIN_PASSWORD=AdminPassword123!
ADMIN_NAME=Admin User
```

⚠️ **IMPORTANT**: For production, change:
- `JWT_SECRET` to a new secure random string
- `ADMIN_PASSWORD` to a secure password
- `CORS_ORIGIN` to your frontend URL once deployed

### Step 4: Get Backend URL

After deployment, Vercel will provide a URL like:
```
https://your-backend-name.vercel.app
```

Save this URL - you'll need it for the frontend configuration.

## Part 2: Deploy Frontend to Vercel

### Step 1: Configure Frontend Environment Variable

Create a `.env.production` file in the frontend directory:

```bash
cd my-accuro-website
```

Create `.env.production`:
```
REACT_APP_API_URL=https://your-backend-name.vercel.app/api
```

Replace `your-backend-name` with your actual backend URL from Step 4 above.

### Step 2: Deploy Frontend

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository (same repo, different project)
3. Select the `my-accuro-website` directory as the root directory
4. Framework Preset: **Create React App**
5. Add environment variable:
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-backend-name.vercel.app/api`
6. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
cd my-accuro-website
vercel --prod
```

### Step 3: Update Backend CORS

After frontend deployment, update the backend environment variable:

1. Go to backend project in Vercel Dashboard
2. Settings → Environment Variables
3. Update `CORS_ORIGIN` to your frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend-name.vercel.app
   ```
4. Redeploy the backend (go to Deployments → click "..." → Redeploy)

## Part 3: Verification

### Test Backend

Visit: `https://your-backend-name.vercel.app/api/health`

You should see:
```json
{
  "success": true,
  "message": "Accuro Backend API is running",
  "timestamp": "2025-..."
}
```

### Test Frontend

1. Visit: `https://your-frontend-name.vercel.app`
2. Test the following:
   - ✅ Homepage loads correctly
   - ✅ Products page shows products
   - ✅ Sign up creates a new account
   - ✅ Login works
   - ✅ Book a meeting works
   - ✅ Contact form works
   - ✅ Add to cart works
   - ✅ Admin dashboard (login with admin credentials)

## Part 4: Custom Domain (Optional)

### Add Custom Domain to Frontend

1. Go to frontend project → Settings → Domains
2. Add your custom domain (e.g., `www.accuro.com.ph`)
3. Follow Vercel's DNS configuration instructions
4. Update backend `CORS_ORIGIN` to use your custom domain

### Add Custom Domain to Backend (Optional)

1. Go to backend project → Settings → Domains
2. Add subdomain (e.g., `api.accuro.com.ph`)
3. Update frontend `REACT_APP_API_URL` environment variable

## Troubleshooting

### Backend Issues

**Issue**: "Cannot connect to MongoDB"
- **Solution**: Check MongoDB Atlas network access settings
  - Go to MongoDB Atlas → Network Access
  - Add `0.0.0.0/0` to allow connections from anywhere
  - Or add Vercel's IP ranges

**Issue**: "Module not found"
- **Solution**: Make sure all dependencies are in `package.json`
- Run `npm install` locally to verify

### Frontend Issues

**Issue**: "Network Error" or API calls fail
- **Solution**: Check `REACT_APP_API_URL` environment variable
- Make sure it ends with `/api`
- Verify backend CORS settings

**Issue**: Blank page after deployment
- **Solution**: Check browser console for errors
- Verify all environment variables are set
- Check Vercel deployment logs

### CORS Issues

**Issue**: "CORS policy blocked"
- **Solution**: Update backend `CORS_ORIGIN` to match frontend URL
- Use `*` temporarily for testing (not recommended for production)

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to your Git repository:

1. **Production**: Pushes to `main` branch deploy to production
2. **Preview**: Pushes to other branches create preview deployments

### Manual Redeployment

1. Go to project in Vercel Dashboard
2. Deployments tab
3. Click "..." on latest deployment
4. Click "Redeploy"

## Environment Variables Management

### To Update Environment Variables:

1. Go to project → Settings → Environment Variables
2. Edit the variable
3. Choose scope: Production, Preview, or Development
4. Save
5. Redeploy the project for changes to take effect

## Security Best Practices

1. ✅ Change default admin password after first login
2. ✅ Use strong JWT_SECRET in production
3. ✅ Enable MongoDB Atlas IP whitelist
4. ✅ Set specific CORS_ORIGIN (not *)
5. ✅ Use environment variables for all secrets
6. ✅ Enable Vercel's authentication protection for admin routes (optional)

## Monitoring

### Vercel Analytics

1. Go to project → Analytics
2. View page views, performance metrics
3. Set up custom events if needed

### Error Monitoring

Check Vercel logs for errors:
1. Go to project → Deployments
2. Click on a deployment
3. View "Functions" tab for backend logs
4. View "Build Logs" for frontend logs

## Support

If you encounter issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Check deployment logs in Vercel Dashboard
3. Test locally first: `npm run build` and `npm start`

## Summary

✅ Backend deployed to Vercel
✅ Frontend deployed to Vercel
✅ Environment variables configured
✅ CORS configured correctly
✅ Database connected
✅ Custom domains configured (optional)

Your Accuro website is now live! 🎉
