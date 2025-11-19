# 🚀 Quick Start Guide - Accuro Mobile App

## Get Your App Running in 5 Minutes!

---

## ✅ Prerequisites Check

Before starting, make sure you have:

- [x] Node.js 16+ installed
- [x] JDK 11+ installed
- [x] Android Studio installed
- [x] Android SDK configured
- [x] Android emulator created OR physical device ready

---

## 🎯 Step 1: Update Backend URL

**IMPORTANT:** The app needs to connect to your backend!

### Edit `src/services/api.ts` (Line 6):

**For Android Emulator:**
```typescript
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000/api'  // ✅ Use this for emulator
  : 'https://your-production-api.com/api';
```

**For Physical Android Device:**
```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.XXX:5000/api'  // Replace XXX with your IP
  : 'https://your-production-api.com/api';
```

**To find your IP:**
- Windows: Open CMD → type `ipconfig` → IPv4 Address
- Mac/Linux: Open Terminal → type `ifconfig` → inet address

---

## 🎯 Step 2: Start Your Backend

**Make sure your Accuro backend is running!**

```bash
# Navigate to your backend folder
cd "C:\Accuro Deployed\calibrex-accuro\backend"

# Start the backend
npm run dev
```

You should see: `Server running on port 5000` ✅

---

## 🎯 Step 3: Start the Mobile App

### Open TWO terminals:

**Terminal 1 - Start Metro Bundler:**
```bash
cd "C:\Accuro Deployed\calibrex-accuro\AccuroMobile"
npm start
```

Wait for: `Metro waiting on exp://...` ✅

**Terminal 2 - Run on Android:**
```bash
cd "C:\Accuro Deployed\calibrex-accuro\AccuroMobile"
npm run android
```

---

## 📱 What Happens Next

1. **Build Process** (first time: 2-5 minutes)
   - Gradle will download dependencies
   - App will compile
   - APK will install on device/emulator

2. **App Launch**
   - You'll see the Accuro splash screen
   - App opens to Login screen

3. **Ready to Test!** 🎉

---

## 🧪 Test the App

### Create an Account:
1. Tap "Sign Up"
2. Enter name, email, password
3. Tap "Sign Up"
4. You're logged in!

### Browse Products:
1. Tap "Products" tab at bottom
2. Search for products
3. Filter by category
4. Add items to cart

### Book a Meeting:
1. Tap "Book" tab
2. Fill in the form
3. Select date and time
4. Submit booking

---

## 🔧 Common Issues & Fixes

### ❌ "Unable to load script"
**Fix:**
```bash
npm start -- --reset-cache
```

### ❌ "Could not connect to development server"
**Fix:**
- Check if Metro is running (Terminal 1)
- Restart Metro: `npm start`

### ❌ "Unable to resolve module"
**Fix:**
```bash
cd android
./gradlew clean
cd ..
npm install
npm start -- --reset-cache
```

### ❌ "Execution failed for task ':app:installDebug'"
**Fix:**
- Close Android emulator
- Restart emulator
- Run `npm run android` again

### ❌ "Connection refused" or "Network error"
**Fix:**
- Check backend is running
- Verify API_BASE_URL in `src/services/api.ts`
- For device: Use computer's IP, not localhost

### ❌ "SDK location not found"
**Fix:**
Create `android/local.properties`:
```
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```
(Replace with your actual SDK path)

---

## 🎮 Development Commands

```bash
# Start Metro
npm start

# Run on Android
npm run android

# Clear cache and restart
npm start -- --reset-cache

# Clean build
cd android
./gradlew clean
cd ..

# View logs
npx react-native log-android
```

---

## 🔄 Hot Reload

**Changes auto-reload!** Just save your file and see updates instantly.

**Force reload:**
- Press `R` twice in Metro terminal
- Or shake device → Reload

---

## 📱 Features to Test

### User Features:
- [x] Sign up / Login
- [x] Browse products (search, filter)
- [x] Add to cart
- [x] Request quotation
- [x] Book meeting
- [x] View dashboard
- [x] Check notifications
- [x] Update profile
- [x] Toggle dark mode

### Admin Features (if you have admin account):
- [x] View analytics
- [x] Manage bookings
- [x] Manage products
- [x] Approve quotations
- [x] View reports

---

## 🌓 Try Dark Mode

1. Go to Profile tab
2. Toggle theme switch
3. App switches to dark mode!

---

## 📸 Take Screenshots (for submission)

**On Emulator:**
- Click camera icon in emulator toolbar
- Screenshots save to Desktop

**On Device:**
- Power + Volume Down buttons
- Screenshots in Gallery

---

## 🚀 Next: Build APK for Submission

Once everything works, build your APK:

**See `APK_BUILD_GUIDE.md` for detailed steps.**

Quick version:
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 💡 Pro Tips

1. **Keep Metro running** - Don't close Terminal 1
2. **Test on real device** - More accurate than emulator
3. **Use React DevTools** - Press `Ctrl+M` (Android) for debug menu
4. **Check logs** - Metro shows errors in real-time
5. **Restart when stuck** - Close Metro, clean, restart

---

## 📞 Need Help?

**App won't start?**
→ Check "Common Issues & Fixes" above

**Backend connection issues?**
→ Verify API_BASE_URL and backend is running

**Build errors?**
→ Run `cd android && ./gradlew clean && cd ..`

**Still stuck?**
→ Check `IMPLEMENTATION_SUMMARY.md` for detailed info

---

## ✅ Success Checklist

Before moving to APK build:

- [ ] Backend running on port 5000
- [ ] API_BASE_URL correctly configured
- [ ] Metro bundler running
- [ ] App launches without errors
- [ ] Can login/signup
- [ ] Can browse products
- [ ] Can create booking
- [ ] All features working

---

## 🎉 You're Ready!

Your app is running! Now you can:
1. ✅ Test all features
2. ✅ Show it to your teachers
3. ✅ Build APK for submission

---

**Happy Testing!** 📱✨

_Need APK? → See APK_BUILD_GUIDE.md_
_Need details? → See IMPLEMENTATION_SUMMARY.md_
_Need overview? → See FINAL_SUMMARY.md_
