# Google Sign-In Implementation - ExamRoot Mobile App

## 📋 Overview

यह implementation **Option 3** use करता है: `expo-auth-session` + Google OAuth 2.0

### Features:
- ✅ **Expo Go Compatible** - Development build की जरूरत नहीं
- ✅ **Modern OAuth 2.0** - PKCE flow with authorization code
- ✅ **React Native 0.85 Support** - Latest version
- ✅ **Secure** - ID token verified on backend
- ✅ **Simple** - सिर्फ 3-4 files updated

---

## 🔧 Files Modified/Created

### 1. `mobile/src/utils/googleSignIn.js` (Rewritten)
**Purpose:** Google OAuth 2.0 sign-in logic

**Key Functions:**
```javascript
configureGoogleSignIn(clientId)  // Initialize with Client ID
signInWithGoogle()               // Open browser & authenticate
signOutGoogle()                  // Logout
```

**What it does:**
- Opens system browser (Chrome Custom Tabs on Android, Safari View on iOS)
- User authenticates with Google
- Returns `idToken` और `accessToken`
- Handles all error cases

---

### 2. `mobile/src/app/login.jsx` (Updated)
**Changes:**
- Added `useEffect` hook for Google Sign-In initialization
- Fixed `handleGooglePress` to use new implementation
- Improved error handling
- Removed unused imports

**Flow:**
```
User taps "Google Sign-In"
  ↓
Browser opens (Google login)
  ↓
User authenticates
  ↓
App receives ID token
  ↓
Send to backend for verification
  ↓
User logged in
```

---

### 3. `mobile/.env` (Created)
**Purpose:** Environment variables

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

### 4. `mobile/.env.example` (Created)
**Purpose:** Template for environment setup

---

### 5. `GOOGLE_OAUTH_SETUP.md` (Created)
**Purpose:** Complete setup guide

---

## 🚀 Quick Start

### Step 1: Google Cloud Console Setup
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URIs:
   ```
   examroot://oauth/google/callback
   ```
4. Copy Client ID

### Step 2: Configure Your App
Edit `mobile/.env`:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=paste-your-client-id-here
```

### Step 3: Backend Integration
Your backend API endpoint `POST /auth/google` should:
1. Receive `idToken` from client
2. Verify token with Google
3. Create/find user in database
4. Return `{ token, user }`

**Example (Node.js):**
```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const { sub, email, name } = ticket.getPayload();
  // ... create/find user and return token
});
```

### Step 4: Test
```bash
cd mobile
npm start
# Press 'a' for Android or 'i' for iOS
```

---

## 🔐 Security

### Token Verification (Critical!)
Never trust the ID token on client side. **Always verify on backend:**

```javascript
// ✅ CORRECT - Backend verification
const ticket = await client.verifyIdToken({
  idToken: idToken,
  audience: process.env.GOOGLE_CLIENT_ID,
});

// ❌ WRONG - Client-side decoding only
const decoded = jwt_decode(idToken);
```

### Best Practices:
1. Store tokens securely using `expo-secure-store` (done for you)
2. Use HTTPS for all backend API calls
3. Implement rate limiting on `/auth/google` endpoint
4. Add CSRF protection if using cookies
5. Refresh tokens periodically

---

## 🐛 Troubleshooting

### Issue: "Invalid redirect URI"
```
Error: redirect_uri_mismatch
```
**Solution:**
- Exact match करना चाहिए Google Console में
- Default: `examroot://oauth/google/callback`
- Check करें `app.json` में `"scheme": "examroot"` है

---

### Issue: "Client ID is required"
```
Error: Google Client ID not configured
```
**Solution:**
- `mobile/.env` में `EXPO_PUBLIC_GOOGLE_CLIENT_ID` add करें
- Expo को restart करें: `npm start`

---

### Issue: Login doesn't work in Expo Go (Prod only)
**Note:** OAuth redirects को Expo Go perfectly support नहीं करता

**Solution:** Development build बनाएँ:
```bash
eas build --platform android --profile preview
# or
eas build --platform ios --profile preview
```

---

### Issue: Multiple redirect URIs needed
**Scenario:** Development, staging, और production के लिए अलग URLs

**Solution:** Google Cloud में अलग-अलग OAuth credentials बनाएँ:
- Development: `com.example.dev` package name
- Production: `com.example.prod` package name

---

## 📱 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│        ExamRoot Mobile App (React Native)           │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Login Screen                                 │  │
│  │                                              │  │
│  │  [Google Sign-In Button]                    │  │
│  │        ↓                                    │  │
│  │  handleGooglePress()                        │  │
│  └──────────────────────────────────────────────┘  │
│        ↓                                           │
│  ┌──────────────────────────────────────────────┐  │
│  │ googleSignIn.js                              │  │
│  │                                              │  │
│  │ configureGoogleSignIn(clientId)             │  │
│  │ signInWithGoogle()                          │  │
│  │   ↓                                         │  │
│  │   Opens system browser                     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────┐
│   Google OAuth Server          │
│   (System Browser)             │
│                                │
│ User logs in with Google      │
│ Returns: ID Token + Access   │
│ Redirect: examroot://...     │
└────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────┐
│      Backend API (Node.js/Python/etc)               │
│                                                     │
│  POST /auth/google                                 │
│  ├─ Verify ID Token                              │
│  ├─ Find/Create User                             │
│  └─ Return { token, user }                       │
└──────────────────────────────────────────────────────┘
```

---

## 📚 API Endpoints

### Sign-In Endpoint
```
POST /auth/google
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4..."}
}

Response:
{
  "success": true,
  "token": "your-jwt-token",
  "user": {
    "id": "user123",
    "email": "user@gmail.com",
    "name": "John Doe",
    "profilePicture": "https://..."
  }
}
```

---

## 🔄 Flow Diagram

```
1. User clicks "Sign in with Google"
   ↓
2. App calls signInWithGoogle()
   ↓
3. System browser opens (Chrome/Safari)
   ↓
4. Google login screen
   ↓
5. User enters credentials
   ↓
6. User grants permissions
   ↓
7. Browser redirects back to app
   ↓
8. App receives ID token
   ↓
9. App sends ID token to backend
   ↓
10. Backend verifies token with Google
   ↓
11. Backend creates/finds user
   ↓
12. Backend returns JWT token + user info
   ↓
13. App stores token in AsyncStorage
   ↓
14. User logged in! ✅
```

---

## 🎯 Next Steps

1. **Immediate:** Setup Google Cloud Console (GOOGLE_OAUTH_SETUP.md)
2. **Backend:** Add `/auth/google` endpoint with token verification
3. **Testing:** Test with Expo Go
4. **Production:** Build EAS development build for production testing
5. **Monitoring:** Add error tracking (Sentry/Bugsnag)

---

## 📖 References

- [Expo Auth Session Documentation](https://docs.expo.dev/guides/authentication/)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [expo-auth-session API Reference](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [PKCE Explanation](https://oauth.net/2/pkce/)

---

## ✅ Testing Checklist

- [ ] Google Cloud Console configured
- [ ] Client ID in `mobile/.env`
- [ ] App runs in Expo Go
- [ ] Google button visible
- [ ] Browser opens when button clicked
- [ ] Google login works
- [ ] Redirect back to app works
- [ ] Backend receives ID token
- [ ] Backend token verification works
- [ ] User stored in database
- [ ] JWT token returned
- [ ] App stores token
- [ ] User logged in state shows
- [ ] OTP method still works
- [ ] User can logout

---

## 💡 Tips

- **Debug:** Check browser console if redirect fails
- **PKCE:** Automatically handled by `expo-auth-session`
- **Scopes:** Limited to `openid`, `profile`, `email` - add more if needed
- **Rate Limiting:** Add on backend to prevent brute force
- **Analytics:** Track sign-in success/failure rates

---

**Last Updated:** June 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready (after backend integration)
