# APK Build Guide - Accuro Mobile App

This guide will help you build a release APK for your Android app.

## Prerequisites

- ✅ Android Studio installed
- ✅ Android SDK configured
- ✅ JDK 11+ installed
- ✅ All dependencies installed (`npm install`)

---

## Step 1: Generate Signing Key

A signing key is required to create a release APK.

### On Windows:
```bash
cd android\app
keytool -genkeypair -v -storetype PKCS12 -keystore accuro-release-key.keystore -alias accuro-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### On Mac/Linux:
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore accuro-release-key.keystore -alias accuro-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**You will be asked for:**
1. Keystore password (remember this!)
2. Key password (remember this!)
3. Your name, organization, city, state, country

**IMPORTANT:** Save these passwords securely! You'll need them to update your app.

---

## Step 2: Configure Gradle for Signing

### Edit `android/gradle.properties`

Add these lines at the end (replace with your actual passwords):

```properties
ACCURO_UPLOAD_STORE_FILE=accuro-release-key.keystore
ACCURO_UPLOAD_KEY_ALIAS=accuro-key-alias
ACCURO_UPLOAD_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD
ACCURO_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

**SECURITY WARNING:** Never commit `gradle.properties` with real passwords to Git!

### Edit `android/app/build.gradle`

Add this inside the `android` block (before `buildTypes`):

```gradle
android {
    // ... existing config ...

    signingConfigs {
        release {
            if (project.hasProperty('ACCURO_UPLOAD_STORE_FILE')) {
                storeFile file(ACCURO_UPLOAD_STORE_FILE)
                storePassword ACCURO_UPLOAD_STORE_PASSWORD
                keyAlias ACCURO_UPLOAD_KEY_ALIAS
                keyPassword ACCURO_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 3: Build the APK

### Clean Previous Builds
```bash
cd android
./gradlew clean
cd ..
```

### Build Release APK
```bash
cd android
./gradlew assembleRelease
```

This may take 5-10 minutes on the first build.

---

## Step 4: Find Your APK

After a successful build, your APK will be at:

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Step 5: Test the APK

### Install on Connected Device
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Or Share the APK
Copy the APK file from the location above and share it via:
- Google Drive
- Email
- USB transfer
- Any file sharing method

---

## Troubleshooting

### Error: "SDK location not found"
**Solution:** Create `android/local.properties` with:
```
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```
(Replace with your actual Android SDK path)

### Error: "Keystore was tampered with, or password was incorrect"
**Solution:** You entered the wrong password. Delete the keystore and create a new one.

### Error: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**Solution:** Uninstall the debug version first:
```bash
adb uninstall com.accuromobile
```

### Build is Slow
**Solution:** Add to `android/gradle.properties`:
```
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

---

## APK Information

- **Package Name:** `com.accuromobile`
- **App Name:** Accuro Mobile
- **Version:** Check `android/app/build.gradle` → `versionName`
- **Build Number:** Check `android/app/build.gradle` → `versionCode`

---

## Updating Version for New Releases

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 2           // Increment this for each release
        versionName "1.0.1"     // Update this for version display
    }
}
```

---

## For Google Play Store (Optional)

If you want to publish to Google Play Store:

### 1. Create App Bundle (AAB)
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 2. Google Play Console
- Create a developer account ($25 one-time fee)
- Upload the AAB file (not APK)
- Fill in app details, screenshots, privacy policy
- Submit for review

---

## Security Best Practices

1. ✅ **Never commit passwords to Git**
   - Add `gradle.properties` to `.gitignore`
   - Use environment variables for CI/CD

2. ✅ **Backup your keystore**
   - Store `accuro-release-key.keystore` in a safe place
   - If you lose it, you can't update your app!

3. ✅ **Use strong passwords**
   - At least 12 characters
   - Mix of letters, numbers, symbols

---

## Quick Reference

### Build Commands
```bash
# Clean
cd android && ./gradlew clean && cd ..

# Build APK
cd android && ./gradlew assembleRelease && cd ..

# Build AAB (for Play Store)
cd android && ./gradlew bundleRelease && cd ..

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk
```

### File Locations
```
Keystore:    android/app/accuro-release-key.keystore
APK Output:  android/app/build/outputs/apk/release/app-release.apk
AAB Output:  android/app/build/outputs/bundle/release/app-release.aab
```

---

## Support

If you encounter issues:
1. Check the error message carefully
2. Google the error message
3. Check React Native documentation
4. Check Android Studio logs

---

**Last Updated:** November 2025
**App Version:** 1.0.0
**React Native Version:** 0.82.1
