# Accuro Mobile APK Builds

This folder contains all production APK builds of the Accuro mobile app.

## Versions

### v1.0 - Initial Release
- **File**: `Accuro-v1.0-initial.apk`
- **Date**: 2025-11-20
- **Changes**:
  - Initial branded mobile app
  - Accuro logo on login/signup screens
  - Basic authentication functionality
  - Navy blue (#001F3F) header with Accuro branding

### v1.1 - Backend Integration & Password Validation
- **File**: `Accuro-v1.1.apk` ✅
- **Date**: 2025-11-20
- **Size**: 65 MB
- **Changes**:
  - Fixed password validation to match backend requirements (8+ chars, uppercase, lowercase, number, special char)
  - Added password strength indicator (Weak/Medium/Strong) with color coding
  - Added visual password requirements checklist with ✓ indicators
  - Added show/hide password toggle on login and signup screens
  - Improved error messages from backend API responses
  - Better error handling and display of validation errors
  - Backend connectivity confirmed working

## How to Install

1. Enable "Install from Unknown Sources" on your Android device
2. Transfer the APK file to your device
3. Open the APK file and follow the installation prompts
4. Launch the Accuro app

## Backend Configuration
- **Production URL**: https://accuro-backend.onrender.com/api
- **Status**: Live and accessible from any network
- **Authentication**: Fully functional

### v1.2 - UI Enhancements & Animations
- **File**: `Accuro-v1.2.apk` ✅
- **Date**: 2025-11-20
- **Size**: 65 MB
- **Changes**:
  - Enhanced theme system with improved typography hierarchy (bold displays, semibold headlines)
  - Theme-aware styling for all authentication screens (light/dark mode support)
  - Smooth fade-in (600ms) and slide-down (500ms) animations on login and signup screens
  - Improved spacing and padding throughout app (24px padding, larger margins)
  - Larger border radius for modern look (16px cards, 24px headers)
  - Better card elevations with proper shadow levels
  - Enhanced dark mode color schemes for better readability
  - All UI elements properly adapt to theme changes

## Current Version
**Latest**: v1.2 - UI Enhancements & Animations
