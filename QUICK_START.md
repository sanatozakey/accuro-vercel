# Quick Start - Deploy to Vercel

## 🚀 5-Minute Deployment

### 1. Deploy Backend (2 minutes)

1. Go to https://vercel.com/new
2. Import your Git repository
3. **Root Directory**: Select `backend`
4. Click **Deploy**
5. After deployment, go to **Settings** → **Environment Variables**
6. Add these variables (copy from your `.env` file):
   ```
   MONGODB_URI=mongodb+srv://sanatozakey_db_user:!Passwordnijuswa69@cluster0.pqufhol.mongodb.net/accuro-db?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=accuro_secret_key_2025_change_in_production_123456789
   JWT_EXPIRE=7d
   CORS_ORIGIN=*
   ADMIN_EMAIL=admin@accuro.com.ph
   ADMIN_PASSWORD=AdminPassword123!
   ADMIN_NAME=Admin User
   NOTIFICATION_EMAIL=iynubauhsoj@gmail.com
   ```
7. **Copy your backend URL** (e.g., `https://backend-xxx.vercel.app`)

### 2. Deploy Frontend (2 minutes)

1. Go to https://vercel.com/new (new tab)
2. Import the **same** Git repository
3. **Root Directory**: Select `my-accuro-website`
4. Framework: **Create React App** (auto-detected)
5. **Environment Variables** → Add:
   - Name: `REACT_APP_API_URL`
   - Value: `https://YOUR-BACKEND-URL.vercel.app/api` (from step 1.7)
6. Click **Deploy**

### 3. Update CORS (1 minute)

1. Go back to **backend** project in Vercel
2. Settings → Environment Variables
3. Edit `CORS_ORIGIN`:
   - Change from `*` to your frontend URL: `https://your-frontend.vercel.app`
4. Deployments → Redeploy

## ✅ Done!

Visit your frontend URL and test:
- Sign up / Login
- Browse products
- Add to cart
- Request quote
- Contact form

## 📱 Optional: Add Custom Domain

### Frontend (www.accuro.com.ph)
1. Frontend project → Settings → Domains
2. Add domain: `www.accuro.com.ph`
3. Follow DNS instructions

### Backend (api.accuro.com.ph)
1. Backend project → Settings → Domains
2. Add domain: `api.accuro.com.ph`
3. Update frontend env: `REACT_APP_API_URL=https://api.accuro.com.ph/api`

## 🔒 Security Notes

After deployment:
1. Change `JWT_SECRET` to a new random string
2. Change `ADMIN_PASSWORD` to a secure password
3. Login to admin account and update password

## 📖 Full Guide

See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
