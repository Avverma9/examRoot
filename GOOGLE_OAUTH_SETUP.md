# Google OAuth Setup for ExamRoot Mobile App

यह guide आपको Google Sign-In को ExamRoot mobile app में setup करने के लिए step-by-step instructions देता है।

## Architecture

हमने **Option 3** use किया है: `expo-auth-session` + Google OAuth

**फायदे:**
- ✅ Expo Go में काम करेगा (Development Build की जरूरत नहीं)
- ✅ Simple implementation
- ✅ Modern OAuth 2.0 with PKCE
- ✅ React Native 0.85 के साथ compatible

---

## Step 1: Google Cloud Console Setup

### 1.1 Google Cloud Project बनाएँ
1. जाएँ [Google Cloud Console](https://console.cloud.google.com/)
2. अगर project नहीं है तो नया बनाएँ
3. Project name: "ExamRoot"

### 1.2 Google+ API Enable करें
1. Search bar में "Google+ API" खोजें
2. "Google+ API" select करें
3. **Enable** button दबाएँ

### 1.3 OAuth 2.0 Credentials बनाएँ

**For Web (यही use करेंगे):**

1. Left sidebar में "Credentials" जाएँ
2. **Create Credentials** → **OAuth 2.0 Client ID** चुनें
3. "Application type" = **Web application**
4. Name दें: "ExamRoot Mobile App"

**Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:8081
http://localhost:5555
https://yourdomain.com  (production के लिए)
```

**Authorized redirect URIs:**
```
examroot://oauth/google/callback
https://yourdomain.com/auth/google/callback  (production के लिए)
```

5. **Create** दबाएँ
6. **Client ID** copy करें (यह आपको दिखेगी)

---

## Step 2: Environment Variable सेट करें

### Mobile के लिए:

`mobile/.env` file को edit करें:

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR_COPIED_CLIENT_ID_HERE
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

`YOUR_COPIED_CLIENT_ID_HERE` को अपनी actual Client ID से replace करें।

---

## Step 3: Backend Integration

अपने backend में Google ID token verify करने के लिए code add करें।

### Node.js/Express Example:

```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;
    
    // Find or create user in database
    let user = await User.findOne({ googleId: sub });
    if (!user) {
      user = await User.create({
        googleId: sub,
        email,
        name,
        profilePicture: picture,
      });
    }
    
    // Generate your app's token
    const token = generateJWT(user);
    
    res.json({ 
      success: true, 
      user, 
      token 
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

---

## Step 4: Testing

### Development में:

```bash
cd mobile
npm start
```

फिर:
- Android: `a` दबाएँ (Android emulator)
- iOS: `i` दबाएँ (iOS simulator)
- Web: `w` दबाएँ

**Google Sign-In button दबाएँ** - एक browser window खुलेगी OAuth flow के लिए।

---

## Troubleshooting

### Error: "Invalid redirect URI"
- ✅ Check करें कि आपकी exact redirect URI Google Console में है
- ✅ `app.json` में `scheme` match कर रहा है: `"scheme": "examroot"`

### Error: "Client ID not found"
- ✅ `.env` file में EXPO_PUBLIC_GOOGLE_CLIENT_ID सेट है?
- ✅ Expo app को restart करें: `npm start` फिर से चलाएँ

### Login button काम नहीं कर रही है Expo Go में
- ⚠️  Expo Go development builds के साथ OAuth redirects को properly support नहीं करता
- ✅ Solution: Development build create करें
  ```bash
  eas build --platform android --profile preview
  # or
  eas build --platform ios --profile preview
  ```

### "Only one redirect URI allowed" error
- ✅ Google Console में आपके अलग-अलग apps के लिए अलग-अलग OAuth credentials बनाएँ

---

## Files Modified

- ✅ `mobile/src/utils/googleSignIn.js` - Google Sign-In logic
- ✅ `mobile/src/app/login.jsx` - Google button integration
- ✅ `mobile/.env` - Environment variables
- ✅ `mobile/.env.example` - Template

---

## Next Steps

1. **Google Cloud Console setup complete करें** (Step 1)
2. **Client ID को `.env` में add करें** (Step 2)
3. **Backend में token verification add करें** (Step 3)
4. **Test करें** (Step 4)

---

## Production Deployment

Production के लिए:

1. **App Store** (iOS) में app upload करें, SHA-1 certificates Google Console में add करें
2. **Google Play Store** (Android) में app upload करें
3. Google Console में production URLs add करें:
   - `https://yourdomain.com/auth/google/callback`
4. Firebase/Backend में proper error handling add करें

---

## References

- [Expo Auth Session Docs](https://docs.expo.dev/guides/authentication/)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
