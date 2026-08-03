# Build Development Client (Custom Dev Build)

## Why Development Build?

**Expo Go limitations**:
- ❌ Cannot use `expo-av` (native video player)
- ❌ Cannot use `expo-application` (app version tracking)
- ❌ Cannot use many native modules

**Development Build benefits**:
- ✅ All native modules work
- ✅ Better performance
- ✅ Closer to production app
- ✅ Test real app features

---

## Prerequisites

### 1. Android Development Setup

**Install Android Studio**:
1. Download from: https://developer.android.com/studio
2. Install with default settings
3. Open Android Studio → More Actions → SDK Manager
4. Install:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools
   - Android Emulator (if you want emulator)

**Add to PATH** (Windows):
1. Open System Environment Variables
2. Add these to PATH:
   - `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk\platform-tools`
   - `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk\tools`

**Verify**:
```bash
adb version
# Should show version number
```

### 2. Connect Android Device

**Enable USB Debugging**:
1. Phone Settings → About Phone
2. Tap "Build Number" 7 times (Developer Mode enabled)
3. Back → Developer Options
4. Enable "USB Debugging"
5. Connect phone via USB
6. Allow USB debugging prompt on phone

**Verify Connection**:
```bash
adb devices
# Should show your device
```

---

## Build Steps

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
cd mobile
eas login
# Enter your Expo account credentials
```

If you don't have an account:
```bash
eas register
```

### Step 3: Configure EAS Build

```bash
eas build:configure
```

This creates `eas.json` file.

### Step 4: Build Development Client (Android)

```bash
eas build --profile development --platform android
```

**Options**:
- Build will happen on Expo servers (cloud build)
- OR you can build locally (requires Android Studio setup)

**For local build**:
```bash
eas build --profile development --platform android --local
```

### Step 5: Install on Device

**After build completes**:

**Option A - Cloud Build**:
1. EAS will give you a download link
2. Download .apk file
3. Transfer to phone
4. Install (may need to allow "Install from unknown sources")

**Option B - Local Build**:
```bash
# APK will be in mobile/android/app/build/outputs/apk/
adb install path/to/app.apk
```

### Step 6: Start Development Server

```bash
npm start
# Press 'a' to open on Android device
```

---

## Alternative: Quick Local Build (Without EAS)

### Android (Faster for testing):

```bash
cd mobile

# Install dependencies
npm install

# Generate native android folder
npx expo prebuild --platform android

# Build and run on connected device
npx expo run:android
```

This will:
1. Generate android native code
2. Build APK
3. Install on connected device
4. Start Metro bundler

**Note**: This is faster but less configurable than EAS build.

---

## Troubleshooting

### Issue: "SDK location not found"

**Fix**:
Create `mobile/android/local.properties`:
```
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

### Issue: "adb: command not found"

**Fix**: Add Android SDK platform-tools to PATH (see Prerequisites)

### Issue: Build fails with "Java not found"

**Fix**: Android Studio includes JDK. Set JAVA_HOME:
```
JAVA_HOME=C:\Program Files\Android\Android Studio\jre
```

### Issue: "Execution failed for task ':app:installDebug'"

**Fix**:
```bash
cd mobile/android
./gradlew clean
cd ..
npx expo run:android
```

---

## After Dev Build Installed

### Test Native Modules:

1. **expo-av (Video Player)**:
   - Open Videos tab
   - Tap any video
   - Should play with native controls

2. **expo-application (App Version)**:
   - Go to Settings
   - Check "Check for Updates"
   - Should show current version

3. **All features should work** without Expo Go limitations

---

## Production Build (Later)

When ready for Play Store:

```bash
eas build --profile production --platform android
```

This creates release APK/AAB for Play Store upload.

---

## Current Status

✅ **expo-av installed** - Ready for dev build
✅ **expo-application installed** - Ready for dev build
✅ **Panel Videos fixed** - All fields working
✅ **WebView video player** - Works in Expo Go
⚠️ **Native video player** - Needs dev build
⚠️ **Windows Firewall** - Manual setup required for local server

---

## Recommended Next Steps

### Option 1: Quick Test (Recommended)
```bash
cd mobile
npx expo run:android
```
- Fastest way to test
- Builds and installs immediately
- Good for development

### Option 2: Proper Build
```bash
eas build --profile development --platform android --local
```
- More control
- Production-like setup
- Requires more configuration

---

## Commands Summary

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Quick build and run (RECOMMENDED)
cd mobile
npx expo run:android

# OR

# EAS build (local)
eas build --profile development --platform android --local

# Start dev server
npm start
```

---

**Time Estimate**:
- Quick build (`expo run:android`): 5-10 minutes
- EAS local build: 15-30 minutes
- EAS cloud build: 20-40 minutes

---

**Need Help?**
- Expo Docs: https://docs.expo.dev/build/setup/
- Android Setup: https://docs.expo.dev/workflow/android-studio-emulator/
