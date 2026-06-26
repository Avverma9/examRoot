# Google Sign-In Troubleshooting Guide

## Current Error: "No Activity found to handle Intent"

### What This Means:
Android device पर कोई browser app properly configured नहीं है जो OAuth URLs handle कर सके.

---

## ✅ Solutions (Try in Order):

### Solution 1: Set Default Browser
1. Device पर **Settings** खोलो
2. **Apps** → **Default apps** जाओ
3. **Browser app** select करो  
4. **Chrome** को default बनाओ
5. App restart करो

### Solution 2: Clear App Data
```bash
adb shell pm clear com.examroot.mobile
```
फिर app fresh install करो

### Solution 3: Enable Chrome Custom Tabs
Device पर:
1. **Settings** → **Apps** → **Chrome**
2. **Storage** → **Clear Cache**
3. App को force stop करके फिर खोलो

### Solution 4: Use Different Device
- Physical device में Chrome properly install होना चाहिए
- या Android Emulator use करो with "Google Play" system image

---

## 📱 Testing Recommendations:

### Option A: Different Physical Device
- OnePlus, Samsung, Pixel devices usually work better
- Ensure Google Play Services installed
- Ensure Chrome is updated

### Option B: Android Emulator (Recommended)
```bash
# Create emulator with Google Play
avdmanager create avd -n Pixel5 -k "system-images;android-34;google_apis_playstore;x86_64" -d "Pixel 5"

# Start emulator  
emulator -avd Pixel5

# Run app
npx expo run:android
```

### Option C: iOS Simulator (If on Mac)
```bash
npx expo run:ios
```
iOS पर यह issue नहीं आता.

---

## 🔧 Alternative Approaches:

### If Browser Still Not Working:

#### Use Web-Based OAuth (Temporary Workaround):
Google Cloud Console में:
1. Redirect URI change करो:
   ```
   https://auth.expo.io/@examroot/mobile/redirect
   ```

2. Code में `googleSignIn.js` में:
   ```javascript
   const redirectUri = makeRedirectUri({ useProxy: true });
   ```

3. EAS Build करो:
   ```bash
   eas build --platform android --profile preview
   ```

**Note:** यह Expo Go में काम करेगा but production build में नहीं.

---

## ✅ Current Setup Status:

| Component | Status | Notes |
|-----------|--------|-------|
| Backend `/auth/google` | ✅ Working | Token verification implemented |
| Mobile `.env` Client ID | ✅ Set | Configured properly |
| Google Cloud Console | ⚠️  Check | Ensure `examroot://oauth/google/callback` added |
| Development Build | ✅ Built | `npx expo run:android` successful |
| Browser on Device | ❌ Issue | "No Activity found" error |

---

## 🎯 Recommended Next Steps:

1. **Try Solution 1** (Set Chrome as default browser)
2. If still fails, **use Android Emulator** with Google Play
3. If urgent, **temporary use web-based OAuth** with Expo proxy

---

## 📞 Need Help?

Error persists तो:
1. Device model और Android version बताइए
2. Chrome version check करें: `Settings → Apps → Chrome → App details`
3. Alternative device या emulator use करें

---

**Last Updated:** June 2026
