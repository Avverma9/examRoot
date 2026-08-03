# 🎨 Thumbnail & Banner Implementation Plan

## 📋 Requirements

1. **Test Series - Thumbnail Image**
   - Location: Test series card in test-series list screen
   - Size: 160px height, full width
   - Show before series title
   - Fallback: Purple icon if no thumbnail

2. **Home Screen - Featured Banners**
   - Location: Top of home screen (hero section)
   - Carousel/Slider or Static
   - Size: Full width, ~200px height
   - Clickable: Navigate to series or external link

3. **Test Series Detail - Hero Banner**
   - Location: Top of detail screen (above series info)
   - Full width
   - Size: ~200px height
   - With series title overlay

---

## 🛠️ Implementation Strategy

### **Backend Changes Needed**

#### 1. TestSeries Model - Already has fields ✅
```javascript
{
  title: String,
  thumbnail: String,      // ✅ Already exists - series card thumbnail
  coverImage: String,     // ✅ Already exists - detail page hero
}
```

#### 2. Create Banner Model (NEW)
```javascript
// server/models/Banner.mjs
{
  title: String,
  description: String,
  imageUrl: String,           // Banner image URL
  actionType: 'series' | 'url', // Where to navigate
  actionValue: String,        // Series ID or external URL
  displayOrder: Number,       // Sort order
  isActive: Boolean,
  startDate: Date,            // When to show
  endDate: Date,              // When to hide
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. API Endpoints (NEW)
```
GET /api/banners/active     # Get active banners for home
POST /api/banners/admin     # Create banner (admin)
PUT /api/banners/admin/:id  # Update banner (admin)
DELETE /api/banners/admin/:id # Delete banner (admin)
```

---

## 📱 Mobile Implementation

### **1. Home Screen - Add Banner Carousel**

**Location:** `mobile/src/app/(tabs)/index.jsx`

Add at top (after header):
```jsx
<BannerCarousel banners={banners} />
```

Create: `mobile/src/components/BannerCarousel.jsx`
- Flat list with horizontal scroll
- Auto-scroll every 5 seconds
- Dot indicators
- Tap to navigate

### **2. Test Series List - Show Thumbnail**

**Location:** `mobile/src/app/(tabs)/test-series.jsx`

Already has the code:
```jsx
{item.thumbnail ? (
  <View style={styles.thumbnailWrap}>
    <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
  </View>
) : null}
```

✅ Just need to populate thumbnail in database

### **3. Test Series Detail - Hero Banner**

**Location:** `mobile/src/app/test-series-detail.jsx`

Add before series header:
```jsx
{series.coverImage && (
  <View style={styles.heroBanner}>
    <Image source={{ uri: series.coverImage }} style={styles.heroBannerImage} />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.gradient}>
      <Text style={styles.heroTitle}>{series.title}</Text>
    </LinearGradient>
  </View>
)}
```

---

## 🎛️ Admin Panel Changes

### **1. Create Banner Management Page**

**Location:** `panel/src/pages/Banners.tsx`

Already exists! Just need to ensure it works properly.

Features:
- Create/Edit/Delete banners
- Upload image URL
- Set dates (optional)
- Choose action type (series or external link)
- Drag to reorder

### **2. Test Series Editor - Add Image Upload**

**Location:** `panel/src/pages/TestSeriesEditor.tsx`

Add fields:
- Thumbnail URL (for list card)
- Cover Image URL (for detail page hero)

---

## 📊 Data Structure

### **TestSeries Document**
```json
{
  "_id": "...",
  "title": "UPSC CSE 2024",
  "thumbnail": "https://cdn.example.com/thumb-1.jpg",  // 160x120px
  "coverImage": "https://cdn.example.com/hero-1.jpg",  // 1200x200px
  "description": "...",
  "bookName": "...",
  // ... other fields
}
```

### **Banner Document**
```json
{
  "_id": "...",
  "title": "Featured Series",
  "imageUrl": "https://cdn.example.com/banner-1.jpg",  // Full width image
  "actionType": "series",
  "actionValue": "series-id-123",
  "displayOrder": 1,
  "isActive": true,
  "startDate": "2024-07-20",
  "endDate": "2024-08-20",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 🖼️ Image Specifications

### **Thumbnail (Series Card)**
- **Dimensions:** 500×300px (display: 160×96px)
- **Format:** JPG/PNG
- **Location:** Above series title
- **Aspect Ratio:** 16:9

### **Cover Image (Detail Hero)**
- **Dimensions:** 1200×240px
- **Format:** JPG/PNG
- **Location:** Top of detail page
- **Aspect Ratio:** 5:1

### **Home Banner**
- **Dimensions:** 1080×220px (display: full width)
- **Format:** JPG/PNG
- **Location:** Top carousel
- **Aspect Ratio:** 5:1
- **Auto-rotate:** Every 5 seconds

---

## ✅ Implementation Checklist

### Phase 1: Backend
- [ ] Create Banner model
- [ ] Create Banner API endpoints
- [ ] Add banner routes
- [ ] Create banner controller

### Phase 2: Admin Panel
- [ ] Update TestSeries editor with image fields
- [ ] Ensure Banner management works
- [ ] Create image upload endpoint

### Phase 3: Mobile Frontend
- [ ] Create BannerCarousel component
- [ ] Add to home screen
- [ ] Test navigation
- [ ] Add hero banner to detail screen
- [ ] Verify thumbnail display in list

### Phase 4: Testing
- [ ] Upload test images
- [ ] Test carousel on various devices
- [ ] Test click navigation
- [ ] Test image loading states
- [ ] Test fallback when image missing

---

## 🚀 Quick Start (Without Complex Upload)

If you want **simple URL-based approach** (no file upload):

1. **Admin Panel:** Text input for image URLs
2. **Paste image URLs** from:
   - Cloudinary
   - AWS S3
   - Google Drive
   - Any CDN

Then reference them in database as URLs.

---

## 📱 Component Example: BannerCarousel

```jsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const BannerCarousel = ({ banners }) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleBannerPress = (banner) => {
    if (banner.actionType === 'series') {
      router.push({
        pathname: '/test-series-detail',
        params: { id: banner.actionValue }
      });
    } else if (banner.actionType === 'url') {
      Linking.openURL(banner.actionValue);
    }
  };

  return (
    <View style={{ width, height: 220, backgroundColor: '#fff', marginBottom: 12 }}>
      <FlatList
        data={banners}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleBannerPress(item)}
            activeOpacity={0.8}
            style={{ width, height: 220 }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item._id}
      />
      
      {/* Dot Indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, position: 'absolute', bottom: 12, left: 0, right: 0 }}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={{
              width: activeIndex === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: activeIndex === index ? '#8B5CF6' : 'rgba(255,255,255,0.5)',
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default BannerCarousel;
```

---

## 🎯 Priority Order

1. **Easy First:** Test Series Thumbnail (already model exists)
2. **Medium:** Home Banner Carousel (new model + component)
3. **Easy:** Test Series Detail Hero Banner (just display coverImage)

---

**Start with any phase you want - let me know!** 🚀
