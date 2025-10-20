# QUICK FIX - Backend URL Configuration

## Issue
Frontend at `accuro-vercel-sfom.vercel.app` is calling `localhost:5000` instead of the actual backend.

## Solution Found
Backend is already deployed at: **https://accuro-vercel.vercel.app/**

✅ Backend is live and responding (tested: `https://accuro-vercel.vercel.app/api/health` returns 200 OK)

## Fix Required

### Configure Vercel Environment Variable

1. Go to: https://vercel.com/dashboard
2. Select project: **accuro-vercel-sfom** (frontend)
3. Settings → Environment Variables
4. Add new variable:
   ```
   Key: REACT_APP_API_URL
   Value: https://accuro-vercel.vercel.app/api
   Environments: ✓ Production ✓ Preview ✓ Development
   ```
5. Save
6. Go to Deployments tab
7. Click latest deployment → Redeploy

### Verification

After redeployment, test:
- Analytics tab should load data
- Reports tab should work
- No 404 errors in console
- All API calls go to `https://accuro-vercel.vercel.app/api/*`

## Why This Fixes Everything

**Before:**
```javascript
API_BASE_URL = undefined → defaults to 'http://localhost:5000/api'
```

**After:**
```javascript
API_BASE_URL = 'https://accuro-vercel.vercel.app/api'
```

All API calls will now go to your deployed backend! ✅

---

## One-Time Setup Needed

This is a **one-time configuration** in Vercel. Once set, all future deployments will automatically use the correct backend URL.

**ETA to fix**: 5 minutes (3 min to configure + 2 min redeploy)

**Status**: Ready to deploy ✅
