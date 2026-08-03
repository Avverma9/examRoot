# 🚀 App Update System - Quick Setup Guide

## ✅ What's Already Installed

### Backend Changes
- ✅ Enhanced `AppUpdate` model with `versionCode`, `isMandatory`, multilingual support
- ✅ Enhanced `User` model with version tracking fields
- ✅ New API endpoints for user tracking and statistics
- ✅ Server running and connected to MongoDB

### Mobile App Changes
- ✅ `expo-application` package installed
- ✅ Settings screen with "Check for Updates" button
- ✅ Automatic update checking hook
- ✅ Beautiful update dialog component
- ✅ Multilingual support (English/Hindi)

### Admin Panel Changes
- ✅ Enhanced App Update management page
- ✅ 3-tab interface: Updates, User Versions, Statistics
- ✅ Form fields for versionCode and multilingual changelogs
- ✅ User distribution analytics

---

## 🎯 Next Steps to Get Started

### 1. **Create Your First Update**

Go to Admin Panel → App Updates → "Create Update"

Fill in:
- **Version:** `1.0.1`
- **Version Code:** `6` (must be > current)
- **Download Link:** Your APK/IPA download URL
- **Description:** Brief overview
- **Changelog (English):** "Bug fixes and improvements"
- **Changelog (Hindi):** "बग फिक्स और सुधार"
- **Mark as Active:** ✓ Check
- **Mandatory:** Leave unchecked (unless critical)

Click "Create"

### 2. **Test on Mobile**

1. Update `mobile/app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 6
       }
     }
   }
   ```

2. Open Settings → Scroll to "App" section
3. Click "Check for Updates"
4. Should show your newly created update
5. Click "Update Now" → Opens download link

### 3. **Monitor Users**

Admin Panel → App Updates → "User Versions" tab

See:
- How many users are on each version
- Percentage distribution
- User adoption rate

### 4. **View Statistics**

Admin Panel → App Updates → Click "Stats" on any update

See:
- Total users
- Users on this version
- Confirmed installations
- Dismissed count
- List of recent installers

---

## 📊 Admin Panel Walkthrough

### Tab 1: App Updates
```
┌─ Create New Update
│  ├─ Version
│  ├─ Version Code (numeric)
│  ├─ Download Link
│  ├─ English Changelog
│  ├─ Hindi Changelog
│  ├─ Mark as Active
│  └─ Mark as Mandatory
│
├─ List all updates with:
│  ├─ Edit
│  ├─ View Stats
│  ├─ Push to all users (if inactive)
│  └─ Delete
└─
```

### Tab 2: User Versions
```
Shows all users grouped by app version:

Version 1.0.1 (Code: 6)
████████████░░░░░░░░  60% (120 users)

Version 1.0.0 (Code: 5)
██████░░░░░░░░░░░░░░  30% (60 users)

Older versions
██░░░░░░░░░░░░░░░░░░  10% (20 users)
```

### Tab 3: Update Stats
```
Statistics for Version 1.0.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Users: 250
On This Version: 120
Confirmed Installs: 45
Dismissed: 12

Recent Installers:
• John Doe (john@example.com) - Today
• Jane Smith (jane@example.com) - Yesterday
• ...
```

---

## 📱 Mobile App Features

### In-App Update Checking

**Automatic:**
- Checks every 60 seconds when app is open
- Checks when user brings app to foreground
- No battery impact (min 30 seconds between checks)

**Manual:**
- Settings → App → "Check for Updates"
- Shows custom update dialog
- One-tap download

### Update Dialog

Shows:
- 🎯 Version number
- 📝 Changelog in user's language
- 🔴 "Mandatory" badge if required
- ✅ "Update Now" button (opens download)
- ⏰ "Later" button (for optional updates)

### Language Support

- English: Settings → Preferences → English
- Hindi: Settings → Preferences → हिंदी

Dialog automatically shows correct language

---

## 🔧 Troubleshooting

### Update Not Showing

1. Check version code is higher
   ```
   Mobile: app.json versionCode: 5
   Server: update versionCode: 6 ✓
   ```

2. Check `isActive` is true in admin

3. Check timestamp (should appear immediately)

### Users Still On Old Version

1. Verify `installedVersionCode` in MongoDB
   ```
   User document → installedVersionCode field
   ```

2. Check app.json version matches

3. Try: Settings → App → "Check for Updates" manually

### Mandatory Update Not Enforcing

1. Verify `isMandatory: true` in database
2. Check version code comparison logic
3. Test with different version numbers

### Admin Panel Not Showing User Data

1. Wait 30 seconds (first update check takes time)
2. Check MongoDB connection: `npm start` output
3. Verify user is logged in and has app opened once
4. Check `/api/app-update/admin/users-by-version` endpoint directly

---

## 🎯 Common Use Cases

### Case 1: Minor Update (New Feature)
```
Version: 1.0.2
Version Code: 7
Mandatory: ❌ (optional)
Changelog: "Added dark mode, improved performance"
Action: Create & set Active
User Experience: See optional update, can update or skip
```

### Case 2: Critical Bug Fix
```
Version: 1.0.3
Version Code: 8
Mandatory: ✅ (required)
Changelog: "Security fix: SQL injection vulnerability"
Action: Create & set Active & Mandatory
User Experience: Cannot skip, must update to use app
```

### Case 3: Re-push Dismissed Update
```
Situation: Users dismissed update, now need to force it
Action: Mark as Mandatory, click "Push"
Effect: 
  - Clear all dismissals
  - Everyone sees dialog again
  - Now mandatory - cannot skip
```

### Case 4: Monitor Adoption
```
Step 1: Create v1.0.4, set Active
Step 2: Wait 24 hours
Step 3: Admin Panel → User Versions tab
Result: See % of users who updated
Step 4: Click "Stats" to see detailed breakdown
```

---

## 📈 Performance Tips

### For Admin
- Check stats weekly to track adoption
- Use mandatory flag only for critical updates
- Allow optional updates 1-2 weeks before next release

### For Developers
- Always increment version code
- Keep changelogs under 500 characters
- Provide both English and Hindi translations
- Test update flow on actual devices

### For Users
- Check for updates weekly
- Install updates as soon as available
- Report if update dialog doesn't appear

---

## 🔐 Security Notes

- **Version codes are numeric** - Prevents comparison issues
- **Mandatory updates cannot be skipped** - For critical fixes
- **Device info tracked** - Platform, OS, device model (no personal data)
- **Dismissal tracking** - Know who saw what update
- **Installation tracking** - Know adoption rate per user

---

## 🆘 Need Help?

### Check Logs

**Server Logs:**
```bash
npm start  # in server folder
# Look for: "[UpdateChecker]" messages
```

**Mobile Console:**
```
Settings → About → Enable Debug Logs
```

### Test Endpoints Directly

```bash
# Get current update (include current version)
curl "http://localhost:5000/api/app-update/current?currentVersionCode=5&currentVersion=1.0.0&platform=android"

# Get all updates (admin only)
curl http://localhost:5000/api/app-update/admin/all

# Get user distribution (admin only)
curl http://localhost:5000/api/app-update/admin/users-by-version
```

---

## ✅ Checklist for First Update

- [ ] App version updated in `mobile/app.json`
- [ ] Version code incremented (higher than current)
- [ ] Admin created update with correct version code
- [ ] Download link verified and working
- [ ] English changelog filled in
- [ ] Hindi changelog filled in (translated)
- [ ] Marked as Active
- [ ] Tested "Check for Updates" on real device
- [ ] Verified update dialog shows correctly
- [ ] Confirmed download link opens in update dialog
- [ ] Checked user distribution in admin panel

---

**System Status:** ✅ Ready to Use
**Last Verified:** July 2026
**Version:** 1.0.0
