# Authentication Setup Documentation

## Overview
The mobile app now has a complete OTP-based authentication system with email verification and new user registration.

## Architecture

### Frontend (Mobile App)
1. **Login Screen** (`src/app/login.jsx`)
   - Email input validation
   - Request OTP functionality
   - Redirects to OTP verification

2. **OTP Verification Screen** (`src/app/otp-verify.jsx`)
   - 6-digit OTP input
   - Username input for new users
   - Auto-resend OTP after cooldown
   - Timer showing OTP expiry (10 minutes)

3. **Auth Context** (`src/context/AuthContext.js`)
   - Manages authentication state globally
   - Loads auth data from AsyncStorage on app startup
   - Provides logout functionality

4. **Auth Redux Slice** (`src/store/slices/authSlice.js`)
   - Stores user data and token
   - Tracks authentication state
   - Manages loading and error states

5. **Auth API Service** (`src/services/authApi.js`)
   - `requestOTP(email)` - Request OTP for email
   - `verifyOTPAndLogin(email, otp, name)` - Verify OTP and login
   - `getCurrentUser(token)` - Fetch user profile
   - `logout(token)` - Logout user

### Backend (Node.js/Express)
1. **Auth Routes** (`server/routes/authRoute.mjs`)
   - `POST /auth/request-otp` - Request OTP
   - `POST /auth/verify-otp` - Verify OTP and login
   - `GET /auth/me` - Get current user (protected)
   - `PUT /auth/profile` - Update user profile (protected)

2. **Auth Controller** (`server/controllers/authController.mjs`)
   - Handles OTP generation and validation
   - User creation for new signups
   - JWT token generation
   - Email verification

3. **Email Service** (`server/utils/email.mjs`)
   - Uses Nodemailer to send OTP emails
   - Beautiful HTML email templates
   - Supports both OTP and welcome emails

4. **OTP Model** (`server/models/OTP.mjs`)
   - Stores OTP with expiry
   - Auto-deletes expired OTPs
   - Tracks failed attempts

5. **User Model** (`server/models/User.mjs`)
   - Stores user information
   - Tracks verification status
   - Records last login

## Authentication Flow

### First-time User (Sign-up via OTP)
1. User enters email on login screen
2. Backend checks if email exists
   - If NOT exists: Sets `requiresName: true` in response
3. User receives OTP via email
4. User enters OTP and username
5. Backend creates new user with username and email
6. JWT token is generated and stored in AsyncStorage
7. User is redirected to home screen

### Existing User (Login via OTP)
1. User enters email on login screen
2. Backend checks if email exists
   - If exists: Sets `requiresName: false` in response
3. User receives OTP via email
4. User enters OTP (no username needed)
5. Backend verifies OTP and updates last login
6. JWT token is generated and stored in AsyncStorage
7. User is redirected to home screen

## Key Features

✅ **Email-based Authentication**
- No passwords needed
- OTP verification ensures email ownership
- 10-minute OTP expiry for security

✅ **Automatic User Registration**
- New users are automatically created on first login
- No separate registration screen needed
- Username is collected at OTP verification stage

✅ **AsyncStorage Integration**
- Tokens and user data persisted locally
- Auto-login on app restart
- Secure logout clears all stored data

✅ **Redux State Management**
- Centralized auth state
- Easy access from any component
- Automatic state initialization from storage

✅ **Protected Routes**
- Unauthenticated users redirected to login
- Authenticated users can access tabs
- Auth context checks on app startup

✅ **Error Handling**
- OTP attempt limits (5 attempts max)
- OTP expiry handling
- User-friendly error messages

✅ **Email Templates**
- Professional OTP email design
- Welcome email for new users
- Branded with ExamRoot logo

## Environment Variables Required

### Backend (.env)
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
PORT=3000
```

### Mobile
- Automatic base URL detection (localhost, emulator, or device IP)

## Installation & Setup

### Backend
1. Environment variables are configured in `.env`
2. Email service is configured with Nodemailer
3. All auth routes are registered in `server/routes/index.mjs`

### Mobile
1. Install dependencies: `npm install`
2. Run: `expo start`
3. Auth will automatically initialize from AsyncStorage if available

## Testing OTP Flow

### In Development
1. Check server logs for OTP code (if email sending fails)
2. Or configure Gmail app password for real email sending
3. OTP expires after 10 minutes
4. Maximum 5 failed attempts before OTP is deleted

### Email Configuration
- Gmail: Use App Password (not regular password)
- Other services: Update `EMAIL_SERVICE` in .env

## Security Considerations

✅ OTP is 6-digit random number
✅ OTP expires after 10 minutes
✅ Failed attempts are tracked (max 5)
✅ JWT token stored securely in AsyncStorage
✅ Password-less authentication (more secure than password-based)
✅ Email validation before sending OTP
✅ User profile updates require authentication token

## Future Enhancements

- Add biometric authentication (fingerprint/face)
- Add social login (Google, GitHub)
- Add password-based login as alternative
- Add email verification for changing email
- Add session management (logout on all devices)
- Add login activity logs

## Troubleshooting

### OTP not received
- Check EMAIL_SERVICE and EMAIL credentials in backend
- Check Gmail app password is correct
- Check email hasn't hit rate limits

### AsyncStorage issues
- Clear app cache: `expo r -c`
- Manually clear storage in device settings

### Authentication fails on app restart
- Check AsyncStorage has correct token format
- Verify JWT_SECRET is same on backend

## File Structure

```
mobile/
├── src/
│   ├── app/
│   │   ├── login.jsx           # Login screen
│   │   ├── otp-verify.jsx      # OTP verification screen
│   │   ├── _layout.jsx         # Root layout with AuthProvider
│   │   └── index.jsx           # Auth routing logic
│   ├── context/
│   │   └── AuthContext.js      # Auth context provider
│   ├── services/
│   │   ├── authApi.js          # Auth API calls
│   │   └── baseUrl.js          # API base URL configuration
│   └── store/
│       └── slices/
│           └── authSlice.js    # Redux auth state

server/
├── controllers/
│   └── authController.mjs      # Auth business logic
├── models/
│   ├── User.mjs                # User schema
│   └── OTP.mjs                 # OTP schema
├── routes/
│   └── authRoute.mjs           # Auth routes
├── utils/
│   └── email.mjs               # Email sending utility
└── middleware/
    └── auth.mjs                # JWT authentication middleware
```
