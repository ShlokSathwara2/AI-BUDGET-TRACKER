# 📱 Complete APK Build Guide - Smart Budget Tracker Mobile

## 🎯 Overview

This guide will help you create an APK file for your Smart Budget Tracker mobile app that you can:
- Install on your Android device
- Share with friends and family
- Distribute to users
- Upload to Google Play Store (with AAB format)

---

## 📋 Prerequisites

Before starting, ensure you have:

1. ✅ **Node.js v18+** installed
2. ✅ **npm v9+** installed  
3. ✅ **Expo CLI** installed globally
4. ✅ **Expo Account** (free at [expo.dev](https://expo.dev))
5. ✅ All project dependencies installed

### Setup Commands

```bash
# Install Expo CLI if not already installed
npm install -g expo-cli

# Navigate to mobile app directory
cd "Smart Budget Tracker/SmartBudgetTrackerMobile"

# Install all dependencies
npm install
```

---

## 🚀 Method 1: EAS Build (Recommended)

### Why EAS Build?

✅ **Cloud-based** - No need for Android Studio  
✅ **Fast** - Builds in 10-15 minutes  
✅ **Reliable** - Handles all native configurations  
✅ **Professional** - Production-ready APKs  
✅ **Free Tier Available** - Perfect for personal use  

### Step-by-Step Instructions

#### Step 1: Install EAS CLI

```bash
npm install -g @expo/eas-cli
```

Verify installation:
```bash
eas --version
```

#### Step 2: Login to Expo

```bash
eas login
```

If you don't have an account:
1. Go to [expo.dev](https://expo.dev)
2. Click "Sign Up"
3. Create free account
4. Return to terminal and login

#### Step 3: Configure EAS Build

Run the configuration wizard:

```bash
eas build:configure
```

This creates `eas.json` file with default configuration:

```json
{
  "cli": {
    "version": ">= 0.43.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**Configuration Explained:**
- `development` - For testing with Expo Go
- `preview` - Creates APK for sharing/testing
- `production` - Creates AAB for Google Play Store

#### Step 4: Update app.json (Optional but Recommended)

Open `app.json` and update:

```json
{
  "expo": {
    "name": "Smart Budget Tracker",
    "slug": "smart-budget-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#6200ee"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.smartbudgettracker"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#6200ee"
      },
      "package": "com.yourcompany.smartbudgettracker",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-from-eas"
      }
    }
  }
}
```

**Important Fields:**
- `android.package` - Unique identifier (like email format)
- `version` - App version
- `icon`, `splash` - App branding

#### Step 5: Build APK for Testing/Sharing

```bash
eas build -p android --profile preview
```

**Command Breakdown:**
- `-p android` - Platform is Android
- `--profile preview` - Uses preview profile (creates APK)

**What Happens:**
1. Project files uploaded to Expo servers
2. Build environment created in cloud
3. Native code compiled
4. APK generated and signed
5. Download link provided

**Build Time:** 10-20 minutes

#### Step 6: Monitor Build Progress

Watch build logs in real-time:
```bash
eas build:list
```

Or view in browser:
```bash
eas build:view <BUILD_ID>
```

#### Step 7: Download APK

Once build completes:

**Option A: Terminal Download**
```bash
eas build:download --platform android --build-id <BUILD_ID>
```

**Option B: Browser Download**
1. Link shown in terminal
2. Click to download
3. APK saved to Downloads folder

**Option C: Expo Dashboard**
1. Go to [expo.dev/accounts/YOUR_ACCOUNT/projects](https://expo.dev/accounts/YOUR_ACCOUNT/projects)
2. Select your project
3. View builds
4. Download APK

---

## 🏪 Method 2: Google Play Store Build (AAB)

### When to Use AAB

Use AAB (Android App Bundle) when:
- Publishing to Google Play Store
- Want smaller downloads for users
- Need Play Feature Delivery

### Build AAB

```bash
eas build -p android --profile production
```

This creates `.aab` file instead of `.apk`.

### Upload to Google Play Store

#### Step 1: Create Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay $25 one-time fee
3. Complete registration

#### Step 2: Create App Listing

1. Click "Create App"
2. Enter app name
3. Select language
4. Choose app or game
5. Free or paid

#### Step 3: Fill Store Details

**Required Information:**
- Short description (80 chars)
- Full description (4000 chars)
- Category (Finance)
- Contact email
- Privacy policy URL

**Assets Needed:**
- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (minimum 2, up to 8)
- Promotional video (optional)

#### Step 4: Upload AAB

1. Go to "Production" track
2. Click "Create new release"
3. Upload AAB file
4. Review and save

#### Step 5: Content Rating

1. Complete questionnaire
2. Get age rating
3. Accept content guidelines

#### Step 6: Pricing & Distribution

1. Set price (free or paid)
2. Select countries
3. Accept distribution agreement

#### Step 7: Submit for Review

1. Answer policy questions
2. Submit for review
3. Wait 2-7 days for approval

---

## 💻 Method 3: Local Build (Advanced)

### Requirements

- **Android Studio** (10+ GB download)
- **Java Development Kit (JDK)** 11+
- **Android SDK** (installed via Android Studio)
- **Command-line tools** knowledge

### When to Use Local Build

- Need full control over build process
- Want to modify native code
- Offline build required
- Custom native modules needed

### Steps

#### Step 1: Eject from Expo

⚠️ **WARNING:** This is IRREVERSIBLE!

```bash
npx expo eject
```

This creates `android/` and `ios/` directories with native code.

#### Step 2: Open in Android Studio

```bash
cd android
./gradlew assembleRelease
```

Or open `android/` folder in Android Studio:
1. File → Open → Select `android/` folder
2. Build → Generate Signed Bundle/APK
3. Follow wizard

#### Step 3: Generate Keystore (First Time Only)

```bash
keytool -genkey -v -keystore smart-budget.keystore -alias smart-budget -keyalg RSA -keysize 2048 -validity 10000
```

Store keystore safely! You'll need it for updates.

#### Step 4: Build Release APK

In `android/gradle.properties`:
```properties
SMARTBUDGET_UPLOAD_STORE_FILE=smart-budget.keystore
SMARTBUDGET_UPLOAD_KEY_ALIAS=smart-budget
SMARTBUDGET_UPLOAD_STORE_PASSWORD=your-password
SMARTBUDGET_UPLOAD_KEY_PASSWORD=your-password
```

Then build:
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📊 Build Comparison

| Method | Time | Difficulty | Size | Best For |
|--------|------|------------|------|----------|
| **EAS Cloud (APK)** | 10-20 min | Easy | ~25 MB | Testing & Sharing |
| **EAS Cloud (AAB)** | 10-20 min | Easy | ~18 MB | Google Play |
| **Local Build** | 30-60 min | Hard | ~25 MB | Advanced Users |

---

## 🔧 Troubleshooting

### Common Issues

#### "Build Failed" Error

**Possible Causes:**
- Invalid configuration
- Missing credentials
- Network issues

**Solution:**
```bash
# Check build logs
eas build:list

# View specific build error
eas build:view <BUILD_ID>

# Try again with clear cache
eas build -p android --profile preview --clear-cache
```

#### "Credentials Required" Error

**Solution:**
```bash
# Let EAS handle credentials automatically
eas credentials

# Or build with auto-setup
eas build -p android --profile preview --auto
```

#### "App.json Configuration Error"

**Check:**
1. Valid JSON syntax
2. All required fields present
3. Package name format correct
4. No special characters in app name

#### Build Stuck at "Running..."

**Solutions:**
- Wait longer (can take 20+ minutes)
- Check internet connection
- View logs in Expo dashboard
- Cancel and restart build

---

## 📱 Installing APK on Device

### Method 1: Direct USB Transfer

1. Connect phone to computer via USB
2. Copy APK to phone
3. On phone, navigate to APK location
4. Tap to install
5. Enable "Install from Unknown Sources" if prompted

### Method 2: Cloud Storage

1. Upload APK to Google Drive, Dropbox, etc.
2. Share link with users
3. Users download on their device
4. Install APK

### Method 3: Email

1. Attach APK to email
2. Send to yourself or users
3. Download attachment on phone
4. Install

### Method 4: QR Code (Using EAS)

```bash
# After build completes
eas build:download --platform android --qr
```

Scan QR code with phone to download directly.

---

## 🔐 Signing Your APK

### Automatic Signing (EAS)

EAS automatically signs your APK with a test key.

**For Production:**
```bash
# Provide your own keystore
eas credentials -p android
```

Upload:
- Keystore file
- Keystore password
- Key alias
- Key password

### Manual Signing (Local Build)

Generate keystore:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-alias -keyalg RSA -keysize 2048 -validity 10000
```

Sign APK:
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release.apk my-alias
```

Verify:
```bash
jarsigner -verify -verbose -certs app-release.apk
```

---

## 📈 Optimizing APK Size

### Tips to Reduce Size

1. **Remove Unused Dependencies**
   ```bash
   npm uninstall unused-package
   ```

2. **Use ProGuard (EAS handles this)**
   
3. **Optimize Images**
   - Compress assets before building
   - Use WebP format where possible

4. **Split by ABI (Automatic in EAS)**
   - arm64-v8a (64-bit ARM)
   - armeabi-v7a (32-bit ARM)
   - x86, x86_64 (Emulators)

### Check APK Contents

```bash
# Unzip to see what's inside
unzip -l app-release.apk
```

---

## 🔄 Updating Your App

### Version Management

In `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

**Version Format:** MAJOR.MINOR.PATCH
- `1.0.0` → Initial release
- `1.0.1` → Bug fixes
- `1.1.0` → New features
- `2.0.0` → Major changes

### Publish Updates

For small JS changes (no native code):
```bash
expo publish
```

Users get update automatically on next app launch.

For native changes:
```bash
# Rebuild entire app
eas build -p android --profile preview
```

---

## 📞 Post-Build Actions

### After Getting APK

1. **Test Thoroughly**
   - Install on multiple devices
   - Test all features
   - Check for crashes

2. **Gather Feedback**
   - Share with beta testers
   - Collect bug reports
   - Note feature requests

3. **Prepare Store Listing** (if publishing)
   - Write compelling description
   - Take attractive screenshots
   - Create promotional materials

4. **Plan Marketing**
   - Social media announcement
   - Blog post
   - Email newsletter

---

## 📚 Additional Resources

### Official Documentation

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Configuration](https://docs.expo.dev/config-reference/app-json/)
- [Google Play Publishing](https://support.google.com/googleplay/android-developer/answer/1134506)

### Community

- [Expo Forums](https://forums.expo.dev/)
- [Reddit r/expo](https://reddit.com/r/expo)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Tools

- [APK Analyzer](https://developer.android.com/studio/debug/apk-analyzer) - Analyze APK size
- [Android Vitals](https://developer.android.com/google/play/vitals) - Performance metrics
- [Firebase App Distribution](https://firebase.google.com/products/app-distribution) - Beta testing

---

## ✅ Build Checklist

### Pre-Build

- [ ] All dependencies installed
- [ ] App tested in development
- [ ] No console errors
- [ ] app.json configured correctly
- [ ] Icons and splash screens ready
- [ ] Version number updated

### During Build

- [ ] Build command executed
- [ ] Monitoring build logs
- [ ] Ready to download APK

### Post-Build

- [ ] APK downloaded successfully
- [ ] Installed on test device
- [ ] All features working
- [ ] No crashes or bugs
- [ ] Ready to share/distribute

---

## 🎉 Success!

Once your APK is built and tested:

1. **Share with Users** - Send APK via email, drive, messaging apps
2. **Collect Feedback** - Listen to user experiences
3. **Iterate** - Improve based on feedback
4. **Publish** - Upload to Play Store when ready

**Your Smart Budget Tracker is now ready for the world!** 🚀📱

---

**Need Help?** Check:
- Main README.md
- GitHub Issues
- Expo Documentation
- Community Forums

**Made with ❤️ by Shlok Sathwara**
