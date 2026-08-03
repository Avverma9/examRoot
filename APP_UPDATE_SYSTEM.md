# 📱 App Version Tracking & Update System

Complete implementation for tracking app versions and managing updates across all users.

---

## 📋 System Overview

This system provides:
1. **Automatic version tracking** - Backend tracks every user's installed app version
2. **Smart update distribution** - Send updates only when there's a newer version
3. **Multilingual changelog** - Support for English and Hindi changelogs
4. **Mandatory updates** - Enforce critical updates across all users
5. **Admin analytics** - Real-time view of user version distribution and update adoption

---

## 🏗️ Architecture

### Backend Components

#### 1. **AppUpdate Model** (`server/models/AppUpdate.mjs`)
```javascript
{
  version: String,              // "1.0.5"
  versionCode: Number,          // 10005 (for numeric comparison)
  downloadLink: String,         // Direct download URL
  description: String,          // Short description
  changelogHindi: String,       // Full changelog in Hindi
  changelogEnglish: String,     // Full changelog in English
  isActive: Boolean,            // Currently active version
  isMandatory: Boolean,         // Force update for all users
  dismissedBy: [UserId],        // Users who dismissed this update
  installedBy: [               // Users who installed this version
    {
      userId: ObjectId,
      installedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **User Model Enhancement** (`server/models/User.mjs`)
```javascript
{
  installedAppVersion: String,  // "1.0.5"
  installedVersionCode: Number, // 10005
  lastAppUpdate: Date,          // When version was last updated
  deviceInfo: {
    platform: String,           // "android" or "ios"
    osVersion: String,          // OS version
    deviceModel: String         // Device model
  }
}
```

#### 3. **API Endpoints** (`server/routes/appUpdateRoute.mjs`)

**Mobile Endpoints:**
- `GET /api/app-update/current?currentVersionCode=X&currentVersion=1.0.0&platform=android`
  - Returns available update if version is older
  - Automatically tracks user's version

- `POST /api/app-update/dismiss`
  - User dismisses or installs update
  - Body: `{ updateId, installed: true/false }`

**Admin Endpoints:**
- `GET /api/app-update/admin/all` - List all updates
- `GET /api/app-update/admin/users-by-version` - User distribution by version
- `GET /api/app-update/admin/:id/stats` - Statistics for specific update
- `POST /api/app-update/admin` - Create new update
- `PUT /api/app-update/admin/:id` - Update existing
- `DELETE /api/app-update/admin/:id` - Delete update
- `POST /api/app-update/admin/:id/push` - Push to all users again

---

## 📱 Mobile App Implementation

### 1. **Settings Screen** (`mobile/src/app/settings.jsx`)

Added "Check for Updates" button that:
- Shows available updates with version info
- Displays multilingual changelog
- Opens download link
- Tracks installation

```tsx
<RowItem
  icon="download-cloud"
  label={language === 'hi' ? 'अपडेट जांचें' : 'Check for Updates'}
  onPress={handleCheckForUpdates}
/>
```

### 2. **Update Checking Hook** (`mobile/src/hooks/useUpdateChecker.js`)

Automatically checks for updates:
- Every 60 seconds when app is active
- When app comes to foreground
- Prevents too-frequent checks (30 second minimum)
- Shows dialog automatically when update available

```jsx
const { updateAvailable, showDialog } = useUpdateChecker(token);
```

### 3. **Update Dialog** (`mobile/src/components/UpdateDialog.jsx`)

Beautiful modal showing:
- Update version and changelog
- "Update Now" button (opens download)
- "Later" button (or mandatory message)
- Progress indicator for mandatory updates

### 4. **API Service** (`mobile/src/services/appUpdateApi.js`)

```javascript
// Get app version info automatically
const { version, versionCode, platform } = getAppVersionInfo();

// Check for updates with version info
const result = await getCurrentUpdate(token);

// Dismiss or mark as installed
await dismissUpdate(token, updateId, installed);
```

---

## 🎛️ Admin Panel Features

### Tab 1: App Updates
**Create/Edit Updates:**
- Version (e.g., "1.0.5")
- Version Code (e.g., "10005") - used for comparison
- Download Link
- Description
- English Changelog
- Hindi Changelog
- Mark as Active
- Mark as Mandatory

**Actions:**
- Edit existing updates
- Delete updates
- Push to all users (resets dismissal)
- View statistics

### Tab 2: User Versions
**Visual Analytics:**
- Total users with version info
- Users per version with percentage
- Progress bars showing adoption rate
- Breakdown by version code

Example:
```
Version 1.0.5 (Code: 10005)
████████████░░░░░░░░  78.5% of users (157/200)

Version 1.0.4 (Code: 10004)
████░░░░░░░░░░░░░░░░  18.0% of users (36/200)

Version 1.0.3 (Code: 10003)
██░░░░░░░░░░░░░░░░░░  3.5% of users (7/200)
```

### Tab 3: Update Statistics
**Per-Update Analytics:**
- Total app users
- Users on this specific version
- Confirmed installations
- Dismissed updates
- List of recent installers with timestamps
- Email list for outreach

---

## 🚀 How It Works

### Update Flow

1. **User Opens App**
   ```
   Mobile App → Reads installed version from app.json
   ↓
   Sends: GET /api/app-update/current
           ?currentVersionCode=10004
           &currentVersion=1.0.4
           &platform=android
   ↓
   Backend → Compares versions (10004 < latest)
   ↓
   Returns: { updateAvailable: true, data: {...} }
   ↓
   Shows update dialog to user
   ```

2. **User Updates**
   ```
   User clicks "Update Now"
   ↓
   Opens download link → APK/IPA download starts
   ↓
   After installation, app sends:
   POST /api/app-update/dismiss
   { updateId, installed: true }
   ↓
   Backend → Adds user to installedBy array
   ↓
   User version tracked in database
   ```

3. **Admin Monitoring**
   ```
   Admin Panel → "User Versions" tab
   ↓
   Shows real-time distribution of versions
   ↓
   Click "Stats" on update → View adoption metrics
   ```

---

## 📊 Example Scenarios

### Scenario 1: Regular Feature Update
1. Create update: Version "1.0.5", Code "10005"
2. Add changelog in English and Hindi
3. Upload APK and get download link
4. Mark as Active
5. Users see dialog in-app → Download → Install tracked

### Scenario 2: Critical Bug Fix (Mandatory)
1. Create update: Version "1.0.6", Code "10006"
2. Add description: "Critical security fix"
3. **Check "Mandatory Update"**
4. Mark as Active
5. Users **cannot dismiss** - must update to continue

### Scenario 3: Re-push Dismissed Update
1. User dismissed update initially
2. Admin decides to push again
3. Click "Push" button on update
4. All dismissals cleared
5. Everyone sees update dialog again

---

## 🔧 Configuration & Setup

### Mobile App Version (app.json)
```json
{
  "expo": {
    "version": "1.0.5",
    "android": {
      "versionCode": 10005
    }
  }
}
```

### Environment Variables
Already configured in `.env` files:
- `VITE_API_BASE_URL` - Backend API URL
- `REACT_APP_API_BASE_URL` - Mobile API URL

---

## 📈 Metrics & Insights

### What You Can Track

1. **Adoption Rate**
   - % of users on latest version
   - Time to adoption

2. **Update Success**
   - Number of confirmed installs
   - User dismissals

3. **Device Distribution**
   - Android vs iOS users
   - OS versions
   - Device models

4. **User Engagement**
   - Last app update timestamp
   - Platform preferences
   - Version stickiness

### Admin Analytics Dashboard Example
```
App Updates Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Latest Version: 1.0.5 (Code: 10005)
Total Users: 250
├─ On Latest: 195 (78%)
├─ Outdated: 45 (18%)
└─ Very Old: 10 (4%)

Mandatory Updates Pending: 0
Active Dismissals: 12

Recent Activity:
• 2 users installed v1.0.5 today
• 1 user dismissed v1.0.5
• 3 new app installs today
```

---

## 🔐 Security & Best Practices

### Mandatory Updates
- Use for critical security patches
- Users cannot skip or dismiss
- Progress message encourages immediate action

### Version Code
- Always increment when releasing
- Must be higher than previous to trigger update
- Numeric comparison prevents issues

### Changelog Support
- Provide detailed info in user's language
- Focus on what's fixed/improved
- Keep concise (under 500 chars recommended)

### Device Tracking
- Tracks platform (Android/iOS)
- Records OS version
- Stores device model (optional)
- All server-side, no personal data

---

## 🛠️ Development Testing

### Test Update Checking
```bash
# Check mobile version
GET http://localhost:5000/api/app-update/current
?currentVersionCode=10004
&currentVersion=1.0.4
&platform=android

# Should return update available if server has higher version
```

### Create Test Update
```bash
POST http://localhost:5000/api/app-update/admin
Content-Type: application/json

{
  "version": "1.0.5",
  "versionCode": 10005,
  "downloadLink": "https://example.com/app-v1.0.5.apk",
  "description": "Bug fixes",
  "changelogEnglish": "Fixed login issue",
  "changelogHindi": "लॉगिन समस्या को ठीक किया",
  "isActive": true,
  "isMandatory": false
}
```

### Check User Versions
```bash
GET http://localhost:5000/api/app-update/admin/users-by-version

# Returns distribution of users across versions
```

---

## 📝 API Response Examples

### Get Current Update
```json
{
  "success": true,
  "updateAvailable": true,
  "data": {
    "_id": "673a...",
    "version": "1.0.5",
    "versionCode": 10005,
    "downloadLink": "https://...",
    "changelogEnglish": "Fixed login issue\nImproved performance",
    "changelogHindi": "लॉगिन समस्या को ठीक किया\nप्रदर्शन में सुधार",
    "isMandatory": false,
    "isActive": true
  }
}
```

### Get User Distribution
```json
{
  "success": true,
  "data": {
    "totalUsers": 250,
    "versionStats": [
      {
        "version": "1.0.5",
        "versionCode": 10005,
        "count": 195,
        "users": [...]
      },
      {
        "version": "1.0.4",
        "versionCode": 10004,
        "count": 45,
        "users": [...]
      }
    ]
  }
}
```

---

## 🎉 Feature Summary

✅ **Automatic Version Tracking** - Every user tracked server-side
✅ **Smart Update Distribution** - Only show to users with older versions
✅ **Multilingual Support** - English & Hindi changelogs
✅ **Mandatory Updates** - Force critical updates
✅ **Admin Analytics** - Real-time adoption metrics
✅ **One-Click Updates** - Direct download from app
✅ **Update Dismissal** - Users can "remind later" (unless mandatory)
✅ **Automatic Checking** - Checks every 60 seconds + on foreground
✅ **Device Info** - Track platform, OS, device model
✅ **Installation Tracking** - Know who installed what version

---

## 📞 Support & Troubleshooting

### Issue: Update not showing to users
- Check `isActive` flag is true
- Verify `versionCode` is higher than user's current version
- Clear app cache and reopen

### Issue: User still on old version
- Check `installedVersionCode` in user database
- Verify push notification (if using)
- Manual version update in app.json

### Issue: Mandatory update not enforcing
- Verify `isMandatory` flag is true
- Check backend version comparison logic
- Test with different versionCode values

---

**Created:** July 2026
**System Version:** 1.0.0
**Last Updated:** Current
