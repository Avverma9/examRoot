# 🔥 Smoke Test Checklist - ExamRoot Mobile App

## Pre-Test Setup

### Backend Server:
```bash
cd server
npm start
# Should show: Server running on http://localhost:5000
```

### Windows Firewall:
✅ Port 5000 allowed (see earlier instructions)

### Mobile App:
```bash
cd mobile
npm start
# Press 'a' for Android
```

---

## Test 1: Authentication ✅

### Login Flow:
- [ ] Open app
- [ ] Shows login screen
- [ ] Enter valid credentials
- [ ] Successfully logs in
- [ ] Shows home screen
- [ ] User name displayed in header

### Expected Errors (should handle gracefully):
- [ ] Wrong password → Shows error message
- [ ] Network error → Shows retry option
- [ ] Empty fields → Shows validation error

---

## Test 2: Home Screen ✅

### Stats Card:
- [ ] Tests Taken count visible
- [ ] Accuracy percentage visible
- [ ] Streak count visible
- [ ] All values are numbers (not null/undefined)

### Banners:
- [ ] ⚠️ Banners NOT showing (production backend issue)
- [ ] When fixed: Auto-rotate every 5 seconds
- [ ] Dot indicators visible
- [ ] Tappable (opens series or URL)

### Quick Links:
- [ ] Test Series button → Opens Test Series tab
- [ ] PYQ Papers button → Opens PYQ tab
- [ ] Video Class button → Opens Videos tab

### Continue Learning:
- [ ] Shows recent in-progress tests/videos
- [ ] NO duplicate entries (same test appears once)
- [ ] Tap Resume → Opens at correct question
- [ ] Progress bar accurate (e.g., 5/50 = 10%)
- [ ] Shows correct resource type icon
- [ ] After completing test → Removed from list
- [ ] Empty state: "No recent activity" message

---

## Test 3: Test Series Tab ✅

### List View:
- [ ] Shows all test series
- [ ] Thumbnails load (if available)
- [ ] Premium badge visible for paid series
- [ ] Tap series → Opens detail page

### Detail Page:
- [ ] Hero banner shows (if coverImage exists)
- [ ] Series title visible
- [ ] Description readable
- [ ] Tests grouped by subject/category
- [ ] Each test card shows:
  - [ ] Test name
  - [ ] Question count
  - [ ] Duration
  - [ ] "Start Test" or "Resume" button

### Starting Test:
- [ ] Tap "Start Test"
- [ ] Opens test player
- [ ] Questions load
- [ ] Timer starts
- [ ] Can answer questions
- [ ] Can navigate next/previous
- [ ] Can mark for review

### Exiting Test:
- [ ] Press back button
- [ ] Shows confirmation dialog
- [ ] Tap "Exit" → Returns to series detail
- [ ] Go to Home → Test appears in Continue Learning
- [ ] Progress saved (current question, answers, time)

### Resuming Test:
- [ ] From Home → Tap Resume
- [ ] Opens at EXACT question where left off
- [ ] Previous answers PRESERVED
- [ ] Timer continues from saved time
- [ ] Can complete test normally

### Completing Test:
- [ ] Answer all questions
- [ ] Tap "Submit"
- [ ] Shows result screen
- [ ] Score calculated correctly
- [ ] Accuracy shown
- [ ] Test REMOVED from Continue Learning

---

## Test 4: Mock Tests Tab ✅

### Same as Test Series (subset):
- [ ] List loads
- [ ] Can start mock test
- [ ] Can exit and resume
- [ ] Progress tracked
- [ ] Results shown after submit

---

## Test 5: Practice Sets Tab ✅

### Practice Flow:
- [ ] Opens practice set
- [ ] No timer (practice mode)
- [ ] Can skip questions
- [ ] Instant feedback after answer
- [ ] Shows correct/incorrect
- [ ] Explanation visible (if available)
- [ ] Can exit and resume
- [ ] Progress tracked

---

## Test 6: Videos Tab ✅

### Video List:
- [ ] Shows all videos
- [ ] Thumbnails load
- [ ] Category badge visible
- [ ] Instructor name shown
- [ ] Duration visible
- [ ] Premium badge (if applicable)

### Video Player:
- [ ] Tap video → Opens player
- [ ] Video loads (WebView)
- [ ] YouTube videos embed correctly
- [ ] Direct URLs play with HTML5 player
- [ ] Back button works
- [ ] Video details shown below
- [ ] View count increments

### Video Progress:
- [ ] Watching >10 seconds → Tracked
- [ ] Appears in Continue Learning (if not completed)
- [ ] Marked complete after watching

---

## Test 7: Settings Screen ✅

### Profile Settings:
- [ ] Name field populated
- [ ] Email shown (read-only)
- [ ] Can edit name
- [ ] Save button works
- [ ] Changes reflected immediately

### Language:
- [ ] Can switch Hindi/English
- [ ] UI updates (if implemented)
- [ ] Preference saved

### Password:
- [ ] Can change password
- [ ] Old password required (if already set)
- [ ] New password validation (min 6 chars)
- [ ] Confirm password match check
- [ ] Success message shown

### App Update:
- [ ] "Check for Updates" button visible
- [ ] Tap button → Checks server
- [ ] If up-to-date → Shows confirmation
- [ ] If update available → Shows dialog with changelog
- [ ] ⚠️ May show error (production backend missing route)

---

## Test 8: Error Handling ✅

### Network Errors:
- [ ] Turn off WiFi
- [ ] Try loading any screen
- [ ] Shows error message (not crash)
- [ ] Retry button works
- [ ] Turn on WiFi → Retry succeeds

### Missing Data:
- [ ] Deleted test in Continue Learning
- [ ] Tap Resume
- [ ] Shows "Test may have been deleted"
- [ ] App doesn't crash
- [ ] Can continue using app

### Invalid States:
- [ ] Empty test list → Shows "No tests available"
- [ ] Empty video list → Shows "No videos available"
- [ ] No continue learning → Shows "No recent activity"

---

## Test 9: Navigation ✅

### Tab Navigation:
- [ ] All 5 tabs work (Home, Test Series, PYQ, Videos, Profile)
- [ ] Can switch between tabs
- [ ] Tab state preserved (scroll position)
- [ ] Back button from sub-screens returns to tab

### Deep Navigation:
- [ ] Home → Continue Learning → Test Player → Back → Home
- [ ] Test Series → Detail → Test Player → Back → Detail → Back → Test Series
- [ ] Videos → Player → Back → Videos

---

## Test 10: Performance ✅

### Load Times:
- [ ] Home screen loads <2 seconds
- [ ] Test series list loads <3 seconds
- [ ] Video list loads <2 seconds
- [ ] Test player opens <1 second

### Memory:
- [ ] App doesn't lag after 10 minutes of use
- [ ] Video player releases memory after closing
- [ ] No noticeable slowdown

### Battery:
- [ ] Normal battery drain during tests
- [ ] Video player doesn't drain excessively

---

## Known Issues (Won't Fix Immediately)

### Production Backend:
- ❌ `/api/banners/active` → 404
- ❌ `/api/app-update/current` → 404
- ⚠️ **Solution**: Deploy latest code to production OR use local server

### Expo Go Limitations:
- ❌ `expo-av` doesn't work (native video player)
- ❌ `expo-application` doesn't work (app version tracking)
- ⚠️ **Solution**: Build development client (see BUILD_DEV_CLIENT.md)

### Windows Firewall:
- ❌ Local server blocked by default
- ⚠️ **Solution**: Manual firewall rule (see earlier instructions)

---

## Critical Bugs to Watch For

### 🔴 High Priority:
1. **App crashes** - Should NEVER happen
2. **Data loss** - Test progress must be saved
3. **Login loop** - User can't access app
4. **Blank screens** - No content shows

### 🟡 Medium Priority:
1. **Slow loading** - Takes >5 seconds
2. **UI glitches** - Overlapping text, broken layout
3. **Inconsistent data** - Stats don't update

### 🟢 Low Priority:
1. **Minor UI issues** - Alignment off by few pixels
2. **Missing animations** - Works but not smooth
3. **Console warnings** - App works fine

---

## Test Results Template

```
Date: _______
Tester: _______
Device: _______
OS Version: _______

✅ PASSED: __ / 10 tests
❌ FAILED: __ / 10 tests
⚠️  SKIPPED: __ / 10 tests

Critical Issues Found:
1. 
2. 
3. 

Medium Issues Found:
1. 
2. 

Notes:


Recommendation: [PASS / FAIL / NEEDS WORK]
```

---

## Quick Smoke Test (5 Minutes)

If you have limited time, test these ONLY:

1. ✅ **Login** - Can log in
2. ✅ **Home loads** - Stats visible
3. ✅ **Start test** - Test player opens
4. ✅ **Exit test** - Appears in Continue Learning
5. ✅ **Resume test** - Opens at correct question
6. ✅ **No crashes** - App stable

If all 6 pass → App is basically working ✅

---

## Automation Potential

Future improvements:
- E2E tests with Detox or Appium
- Unit tests for critical functions
- API integration tests
- Performance monitoring

---

**Last Updated**: Now
**Status**: Ready for Smoke Testing 🔥
**Confidence Level**: High (most issues fixed)

**Start Testing**: `cd mobile && npm start` 🚀
