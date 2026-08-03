# 🔍 App Crash Debugging Instructions

## Problem
APK install hone ke baad open karte hi crash ho raha hai.

## ✅ Recommended Testing Methods

### Method 1: Expo Development Build (Sabse Best!)
```bash
cd mobile
npx expo start --dev-client

# Ya direct
npm run android
```

**Benefits:**
- Live reload
- Real-time console logs
- Exact error messages dikhengi
- No build time wait

### Method 2: Check Existing Release APK Logs

Agar device pe already APK install hai:

```bash
# Logcat start karo (separate terminal mein)
adb logcat | findstr "examroot\|AndroidRuntime\|FATAL\|ReactNative"

# Ab app kholo - crash hone pe log dikhega
```

### Method 3: Android Studio se Run

1. Android Studio open karo
2. `mobile/android` folder open karo
3. Device connect karo
4. Run button (▶️) click karo
5. Logcat tab mein errors dikhengi

## 🐛 Common Crash Causes (Our Fixes)

### 1. Constants.expoConfig Issue ✅ FIXED
**Problem**: Release build mein `Constants.manifest/manifest2` undefined hote hain
**Fix**: Hardcoded fallback values add kiye with safe error handling

### 2. BASE_URL Import Error ✅ FIXED  
**Problem**: Old `baseUrl.js` delete ho gayi thi
**Fix**: Both approaches restored - `baseUrl.js` + `app.config.js`

### 3. ErrorBoundary Crash ✅ FIXED
**Problem**: Uncaught errors direct crash kar rahe the
**Fix**: Global error handler + enhanced ErrorBoundary

## 📱 Current Build Status

**Version**: 1.0.9 (versionCode: 9)
**Last Build**: Successfully created
**Location**: `mobile/android/app/build/outputs/apk/release/app-release.apk`

## 🔧 Quick Tests

### Test 1: Config Loading
Open Metro bundler output - should see:
```
✅ App Config Loaded
  API: https://backend.examroot.cc/api
  Source: Hardcoded (ya Constants)
```

### Test 2: App Launch
App launch screen tak aana chahiye (crash nahi)

### Test 3: API Calls
Login screen pe ja kar test karo - API calls work karni chahiye

## 🚨 If Still Crashing

1. **Check Logcat**:
```bash
adb logcat *:E
```

2. **Specific Error Search**:
```bash
adb logcat | findstr "Error\|Exception\|Crash"
```

3. **React Native Logs**:
```bash
adb logcat | findstr "ReactNativeJS"
```

## 📝 Next Steps

1. ✅ Start Metro bundler: `npx expo start`
2. ✅ Test on device/emulator
3. ✅ Check console for errors
4. ✅ Test API endpoints
5. ✅ Verify all screens work

## 🛠️ Backup Plan

Agar sab fail ho jaye:
- Pehle ka working version restore karo
- Git se last working commit checkout karo
- Changes gradually apply karo
