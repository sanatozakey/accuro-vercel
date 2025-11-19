# Accuro Mobile App

React Native mobile application for Accuro Calibration Solutions.

## 🎯 Project Overview

Comprehensive mobile app bringing all features of the Accuro web platform to Android devices:

- Authentication (Login, Signup, Password Reset, Email Verification)
- Product Catalog with AI recommendations
- Shopping Cart with persistent storage
- Booking System with calendar
- Quotation Management
- Admin Dashboard with analytics
- User Dashboard with activity tracking
- Push Notifications
- Dark/Light Theme Support

## 📁 Project Structure

```
AccuroMobile/
├── src/
│   ├── assets/              # Images, fonts, icons
│   ├── components/          # Reusable UI components
│   ├── screens/             # App screens (auth, main, user, admin)
│   ├── navigation/          # Navigation config
│   ├── contexts/            # React contexts (Auth, Cart, Theme) ✅
│   ├── services/            # API services ✅
│   ├── utils/               # Utility functions
│   ├── hooks/               # Custom hooks
│   ├── constants/           # App constants ✅
│   ├── types/               # TypeScript types ✅
│   └── theme/               # Theme config
└── android/                 # Android native code
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android (emulator or device)
npm run android
```

## ✅ What's Complete

### Foundation (DONE)
- ✅ Project structure (27 directories)
- ✅ TypeScript configuration
- ✅ Core dependencies installed:
  - React Navigation
  - React Native Paper (UI)
  - AsyncStorage
  - Axios
  - Gesture Handler & Reanimated
- ✅ **API Service** with JWT auth interceptors
- ✅ **AuthContext** - Authentication state management
- ✅ **CartContext** - Shopping cart with persistence
- ✅ **ThemeContext** - Dark/light mode
- ✅ **TypeScript types** for all data models
- ✅ **Constants** (API endpoints, colors, config)

## 📋 Next Steps

### Immediate (Phase 1 - Week 1-4)
- [ ] Navigation setup (Stack, Tab, Drawer)
- [ ] Common UI components (Button, Input, Card)
- [ ] Auth screens (Login, Signup, Password Reset)
- [ ] Theme configuration

### Phase 2 (Week 5-9)
- [ ] Product catalog screens
- [ ] Cart implementation
- [ ] Booking system
- [ ] User dashboard

### Phase 3 (Week 10-14)
- [ ] Admin dashboard
- [ ] Product/Booking/Quotation management
- [ ] Analytics

### Phase 4 (Week 15-18)
- [ ] Notifications
- [ ] Performance optimization
- [ ] Testing

### Phase 5 (Week 19-21)
- [ ] APK generation
- [ ] Testing on devices
- [ ] Deployment preparation

## 🔧 Configuration

### Backend API

Update in `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000/api'  // Android emulator
  : 'https://your-api.com/api';  // Production
```

For physical device: Use `http://YOUR_LOCAL_IP:5000/api`

### Environment Variables

Copy `.env.example` to `.env` and configure.

## 🏗️ Build Release APK

```bash
# Generate signing key
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore accuro-release-key.keystore -alias accuro-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Build release
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

## 📱 Requirements

- **Android:** 8.0+ (API 26+)
- **Node.js:** 16+
- **JDK:** 11+
- **Android Studio** with SDK

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/services/api.ts` | Axios instance with auth interceptors |
| `src/contexts/AuthContext.tsx` | Authentication state |
| `src/contexts/CartContext.tsx` | Shopping cart management |
| `src/contexts/ThemeContext.tsx` | Theme switching |
| `src/constants/api.ts` | All API endpoints |
| `src/constants/config.ts` | App configuration |
| `src/types/index.ts` | TypeScript interfaces |

## 🎓 Project Info

**Status:** 🚧 Phase 1 - Foundation Complete
**Timeline:** 18-21 weeks total
**Target:** Android APK for school submission

---

**Last Updated:** November 2025 | **Version:** 1.0.0-alpha
