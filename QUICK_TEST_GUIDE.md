# Quick Test Guide - After Vercel Deployment

## Wait for Deployment to Complete

Go to https://vercel.com/dashboard → **accuro-vercel-sfom** → **Deployments**

Wait until status shows: ✅ **Ready**

---

## Test 1: /quote Redirect (Fixed)

**Steps:**
1. Go to: https://accuro-vercel-sfom.vercel.app/quote
2. Should immediately redirect to `/products` page
3. ✅ **Pass**: Shows products page
4. ❌ **Fail**: Shows blank page

---

## Test 2: Contact Form Validation (Fixed)

**Steps:**
1. Go to: https://accuro-vercel-sfom.vercel.app/contact
2. Fill out the form
3. In the "Message" field, type only **8 characters** (e.g., "test msg")
4. Click "Send Message"

**Expected Result:**
```
Error message: "Message must be at least 20 characters long. You currently have 8 characters."
```

5. ✅ **Pass**: Shows character count in error
6. ❌ **Fail**: Says "Validation failed" or other generic error

---

## Test 3: Analytics Tab (Should Work Now)

**Steps:**
1. Login as admin
2. Go to: https://accuro-vercel-sfom.vercel.app/admin/bookings
3. Click the **"Analytics"** tab
4. Wait for loading to complete

**Expected Results:**

**If it works:**
- ✅ Shows dashboard with charts (sample data or real data)
- ✅ Shows metrics: Total Bookings, Total Users, Quote Requests, Contact Forms
- ✅ Charts are interactive

**If it fails (better error now):**
- ⚠️ Shows red error box with specific error message
- ⚠️ Shows "Try Again" button
- ⚠️ Error is detailed, not just "Failed to load analytics"

**Debug Steps if Failed:**
1. Press F12 to open Developer Tools
2. Go to "Console" tab
3. Look for error messages (red text)
4. Take screenshot and share - errors will now be detailed

---

## Test 4: Reports Tab (Should Work Now)

**Steps:**
1. Still in `/admin/bookings`
2. Click the **"Reports"** tab

**Expected Results:**

**If it works:**
- ✅ Shows "Generate New Report" form
- ✅ Shows "No Reports Yet" (if no reports generated)
- ✅ Can select report type, dates, and click "Generate Report"

**If it fails:**
- ❌ Should NOT show "Failed to load reports data"
- ⚠️ If error occurs, check F12 Console for details

---

## Test 5: View Total Bookings (Analytics Drill-Down)

**Steps:**
1. In Analytics tab
2. Click on the **"Total Bookings"** card (blue card with number)

**Expected Result:**
- ✅ Opens a modal showing booking details
- ✅ Modal has title "All Bookings"
- ✅ Shows table with booking records

**If it fails:**
- Check F12 Console for errors
- Modal might be empty if there's no data

---

## Common Issues & Solutions

### Issue: Analytics/Reports Still Show Errors

**Check 1: API URL Environment Variable**
```
Vercel → accuro-vercel-sfom → Settings → Environment Variables
Should see:
Name: REACT_APP_API_URL
Value: https://accuro-vercel.vercel.app/api
```

**Check 2: Frontend Was Redeployed After Adding Env Var**
- Adding env var alone isn't enough
- Must redeploy after adding it
- Check deployment time is AFTER env var was added

**Check 3: Browser Console Errors**
1. Open F12 → Console tab
2. Look for errors like:
   - `POST https://accuro-vercel.vercel.app/api/analytics/dashboard 401`
   - `CORS error`
   - `Network Error`

### Issue: Still Going to localhost

If you see errors about `localhost:5000`:
- ❌ Environment variable not set correctly
- ❌ Frontend not redeployed after env var change
- ❌ Browser cache (try hard refresh: Ctrl+Shift+R)

---

## What to Report Back

Please test all 5 items above and let me know:

1. **Quote redirect**: ✅ or ❌
2. **Contact validation**: ✅ or ❌ (include exact error message if failed)
3. **Analytics tab**: ✅ or ❌ (include F12 console errors if failed)
4. **Reports tab**: ✅ or ❌ (include F12 console errors if failed)
5. **Total Bookings modal**: ✅ or ❌

If anything fails, share:
- Screenshot of the error
- Screenshot of F12 Console tab (errors will now be detailed)
- Screenshot of Vercel environment variables page

---

## Expected Timeline

- Vercel deployment: 2-5 minutes
- Testing all 5 items: 3-5 minutes
- **Total**: About 10 minutes

Let me know the results!
