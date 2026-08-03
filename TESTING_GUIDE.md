# Task 2 Testing Guide - Banners & Thumbnails

## Quick Start Testing

### Prerequisites
- Server running: `npm run dev` in `server/` directory
- Backend running at `http://localhost:5000`

---

## Part 1: Admin Panel Testing (Banners & Videos)

### Start Panel
```bash
cd panel
npm run dev
# Navigate to http://localhost:5173
```

### Test Banners

**1. Create Banner**
- Go to admin dashboard → Banners
- Click "+ Create Banner"
- Fill in details:
  - Title: "Summer Sale"
  - Image URL: `https://res.cloudinary.com/demo/image/fetch/w_1080,h_220,c_fill/https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/1200px-PNG_transparency_demonstration_1.png`
  - Action Type: "None" (or select a series/URL)
  - Display Order: 0
  - Active: checked
- Click "Create"
- Verify success message

**2. View Banners**
- Should see banner grid with image preview
- Verify thumbnail displays correctly
- Check status shows "Active"

**3. Edit Banner**
- Click "Edit" on any banner
- Change title or description
- Click "Update"
- Verify changes appear in grid

**4. Delete Banner**
- Click "Delete" on banner
- Confirm deletion
- Banner should disappear from list

**5. Display Order**
- Create multiple banners
- Each should have a number in the grid
- Lower numbers appear first in mobile carousel

### Test Videos

**1. Add Video**
- Go to Videos page
- Click "+ Add Video"
- Fill in:
  - Title: "History Basics"
  - YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
  - Category: "History"
  - Duration: 45
  - Thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`
  - Publish: checked
- Click "Create"

**2. View Videos**
- Should see table with thumbnails
- Check all columns display correctly

**3. Edit Video**
- Click "Edit" on video
- Change title or category
- Click "Update"

**4. Delete Video**
- Click "Delete" on video
- Confirm deletion

---

## Part 2: Mobile App Testing

### Setup Mobile Development Build

```bash
cd mobile

# Clear cache
expo start --clear

# Then in another terminal (Option A: Android)
expo run:android

# Or Option B: iOS
expo run:ios

# Or Option C: Expo Go (won't work with expo-application)
# - Press 's' in the Expo terminal
# - Scan QR code - NOT RECOMMENDED
```

**Important**: Must use `expo run:android` or `expo run:ios` due to `expo-application` dependency.

### Test Banner Carousel on Home Screen

**1. Launch App**
- App should open to home screen
- At the very top, below header, should see banner carousel

**2. Visual Checks**
- ✅ Banner image displays (1080×220px recommended)
- ✅ Carousel auto-rotates every 5 seconds
- ✅ Dot indicators at bottom showing current position
- ✅ Purple dots highlight current banner
- ✅ White semi-transparent dots show other banners

**3. User Interaction**
- Tap banner → should open series/URL (if configured with action)
- Swipe left → goes to next banner
- Swipe right → goes to previous banner
- Dots update as you scroll

**4. No Banners State**
- If no banners exist on server, carousel should not appear (returns null)
- Rest of home screen loads normally

### Test Update Checking in Settings

**1. Navigate to Settings**
- From any screen, tap Settings icon
- Or use back button if in another screen

**2. Update Check Button**
- Scroll to "App" section at bottom
- See "Version" showing current app version
- Tap "Check for Updates"
- Loading spinner should appear

**3. Update Available Scenario**
- If new version exists in backend:
  - Alert dialog appears with version number
  - Shows changelog (English or Hindi based on language preference)
  - Two options: "Later" or "Update Now"
  - "Update Now" opens download link
  - "Later" closes dialog

**4. No Update Scenario**
- If no new update:
  - Alert shows "You're up to date! ✅"
  - Displays current version number

**5. Language Support**
- Change language to Hindi in settings
- Check for updates again
- Alert should show Hindi changelog if available
- Buttons show Hindi text

---

## Part 3: Backend Verification

### Check Banner Data in Database

```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/examroot

# Check banners collection
db.banners.find().pretty()

# Should show:
# {
#   _id: ObjectId(...),
#   title: "Summer Sale",
#   imageUrl: "https://...",
#   actionType: "none",
#   displayOrder: 0,
#   isActive: true,
#   createdAt: ISODate(...),
#   updatedAt: ISODate(...)
# }
```

### Test API Endpoints Directly

**Get Active Banners (Mobile)**
```bash
curl http://localhost:5000/api/banners/active

# Expected response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Summer Sale",
      "imageUrl": "https://...",
      "actionType": "none",
      "actionValue": "",
      "displayOrder": 0
    }
  ]
}
```

**Get All Banners (Admin)**
```bash
curl http://localhost:5000/api/banners/admin/all

# Expected response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Summer Sale",
      "description": "...",
      "imageUrl": "https://...",
      "actionType": "none",
      "actionValue": "",
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Create Banner (Admin)**
```bash
curl -X POST http://localhost:5000/api/banners/admin \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Banner",
    "imageUrl": "https://example.com/banner.jpg",
    "actionType": "none",
    "displayOrder": 0
  }'
```

---

## Part 4: Troubleshooting

### Banners Not Showing in Mobile

**Problem**: Home screen doesn't show banner carousel

**Solutions**:
1. Check server is running: `npm run dev` in server directory
2. Check API endpoint: `curl http://localhost:5000/api/banners/active`
3. Verify banners exist: MongoDB query shows records
4. Check isActive: true in database
5. Check scheduling: startDate/endDate allow current time
6. Clear app cache: `expo start --clear`
7. Check mobile logs: Look for errors in console

### Panel Not Showing Banners

**Problem**: Banners page doesn't load or shows error

**Solutions**:
1. Check network tab in browser DevTools for API errors
2. Verify API URL is correct in `.env`
3. Check RTK Query hooks are imported correctly
4. Look for JavaScript errors in browser console
5. Restart panel dev server: `npm run dev`

### Update Check Not Working

**Problem**: "Check for Updates" button does nothing

**Solutions**:
1. Verify app update records in database
2. Test endpoint: `curl http://localhost:5000/api/app-update/current`
3. Check token is being sent correctly
4. Look for network errors in mobile console
5. Verify getCurrentUpdate function is working

### Image URLs Not Loading

**Problem**: Banners/videos show broken image icon

**Solutions**:
1. Verify URL is publicly accessible
2. Test URL in browser directly
3. Check image dimensions match recommendations
4. Use HTTPS URLs only (not HTTP for mobile)
5. Try different image hosting (Cloudinary, Imgur)

---

## Success Checklist

### Admin Panel ✅
- [ ] Can create banners
- [ ] Can edit banners
- [ ] Can delete banners
- [ ] Banner images display in grid
- [ ] Can create videos
- [ ] Can edit videos
- [ ] Can delete videos
- [ ] Video thumbnails display

### Mobile App ✅
- [ ] Banner carousel displays on home
- [ ] Banners auto-rotate every 5 seconds
- [ ] Dot indicators show and update
- [ ] Tap banner opens URL/series (if configured)
- [ ] Settings page loads without errors
- [ ] "Check for Updates" button works
- [ ] Update dialog shows when available
- [ ] Update dialog shows bilingual content
- [ ] App version displays correctly

### Backend ✅
- [ ] Banner CRUD endpoints work
- [ ] Video CRUD endpoints work
- [ ] Active banners endpoint returns correct data
- [ ] Database records are created/updated/deleted correctly
- [ ] No console logs in production code

---

## Performance Tips

1. **Image Optimization**
   - Use recommended sizes (1080×220 for banners)
   - Compress images before uploading
   - Use Cloudinary for CDN benefits

2. **Banner Load Time**
   - Banners load on component mount
   - Carousel starts after data loads
   - Use `getActiveBanners()` for efficient queries

3. **Database Indexes**
   - Banner queries indexed on isActive and displayOrder
   - Queries should complete in <100ms

---

## Next Steps After Testing

1. **Thumbnail Integration**
   - Add thumbnailUrl field to TestSeries model
   - Update test series cards to show images
   - Update admin panel to allow thumbnail upload

2. **Hero Images**
   - Add heroImageUrl field to TestSeries
   - Display on test series detail page
   - Add gradient overlay effect

3. **Analytics**
   - Track banner click counts
   - Track video play counts
   - Dashboard showing engagement metrics

4. **Multilingual Content**
   - Translate banner titles
   - Add Hindi descriptions
   - Support more languages as needed

---

## Database Backup Before Testing

```bash
# Backup collections
mongodump --db examroot --out ./backup

# Restore if needed
mongorestore --db examroot ./backup/examroot
```

---

**All systems are ready for testing! 🚀**
