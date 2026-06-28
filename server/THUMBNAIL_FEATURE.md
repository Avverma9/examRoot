# Test Series Thumbnail Feature

## Overview
This document describes the implementation of R2-based thumbnail uploads for Test Series in the ExamRoot application.

## Architecture

### Server-Side (`server/`)

#### 1. Model Changes
**File**: `server/models/TestSeries.mjs`
- Added `thumbnail` field (String, default: "")
- Stores R2 public URL of the uploaded thumbnail image
- Example: `"https://pub-xxx.r2.dev/test-series-thumbnails/uuid.jpg"`

#### 2. Controller Endpoints
**File**: `server/controllers/testSeriesController.mjs`

Three new endpoints added:

##### a) `getThumnailPresignedUrl` - Generate Upload URL
- **Route**: `POST /api/test-series/:id/thumbnail-presign`
- **Body**: `{ filename: string, contentType: string }`
- **Returns**: `{ uploadUrl, publicUrl, key }`
- **Process**:
  1. Validates that series exists
  2. Validates MIME type (jpeg, png, webp only)
  3. Generates presigned PUT URL valid for 5 minutes
  4. Client uploads directly to R2 via presigned URL
  5. Returns public URL for storage in DB

##### b) `saveSeriesThumbnail` - Save URL to Database
- **Route**: `PUT /api/test-series/:id/thumbnail`
- **Body**: `{ thumbnailUrl: string }`
- **Returns**: Updated series object
- **Process**:
  1. Updates series.thumbnail field with R2 public URL
  2. Called by client after successful R2 upload

##### c) `deleteSeriesThumbnail` - Delete Thumbnail
- **Route**: `DELETE /api/test-series/:id/thumbnail`
- **Returns**: Updated series object
- **Process**:
  1. Extracts R2 object key from public URL
  2. Deletes file from R2 bucket
  3. Clears thumbnail field in database

#### 3. Routes
**File**: `server/routes/testSeriesRoute.mjs`
```javascript
router.post("/:id/thumbnail-presign", getThumnailPresignedUrl);
router.put("/:id/thumbnail", saveSeriesThumbnail);
router.delete("/:id/thumbnail", deleteSeriesThumbnail);
```

### Client-Side

#### Panel (`panel/src/`)

**API Service**: `panel/src/services/testSeriesApi.js`
- `getThumbnailPresignedUrl(id, { filename, contentType })` - Get upload URL
- `saveSeriesThumbnail(id, { thumbnailUrl })` - Save URL to DB
- `deleteSeriesThumbnail(id)` - Delete thumbnail

**Upload Utility**: `panel/src/utils/uploadToR2.js`
- `uploadToR2({ file, type, onProgress })` - Upload file directly to R2
- Returns public URL after successful upload

**UI Component**: `panel/src/pages/TestSeries.jsx`
- File input for thumbnail selection
- Real-time preview of uploaded thumbnail
- Remove button to delete thumbnail
- Status messages and error handling
- Integrated in test series creation/edit form

#### Mobile (`mobile/src/`)

**API Service**: Mobile uses Redux slices (no RTK Query needed for fetch)

**Upload Utility**: `mobile/src/utils/uploadToR2.js`
- `uploadToR2({ token, fileUri, contentType, type, filename, onProgress })` - Upload from mobile
- Handles image picker integration
- Supports progress tracking

**UI Component**: `mobile/src/app/(tabs)/test-series.jsx`
- Displays thumbnail image above series title
- Falls back to book icon if no thumbnail
- Responsive card layout with 160px height thumbnail

## Upload Flow

### Panel (Admin)
```
1. Admin selects file via file input
2. Frontend calls POST /api/test-series/:id/thumbnail-presign
3. Server returns presigned URL
4. Frontend PUT file directly to R2 (no server bandwidth)
5. Frontend calls PUT /api/test-series/:id/thumbnail with publicUrl
6. Server saves URL to database
7. UI shows thumbnail preview
```

### Mobile (User)
```
1. Test series list fetches from /api/test-series
2. Each series has thumbnail field populated
3. Mobile renders thumbnail image in card
4. No user uploads needed (admin only)
```

## File Storage Structure

**R2 Bucket**: `examroot`
**Path**: `test-series-thumbnails/{uuid}.{ext}`

Example:
```
test-series-thumbnails/550e8400-e29b-41d4-a716-446655440000.jpg
test-series-thumbnails/6ba7b810-9dad-11d1-80b4-00c04fd430c8.png
```

## Key Features

✅ **Presigned URLs**: No server bandwidth used for uploads
✅ **Direct R2 Upload**: Client uploads directly to cloud storage
✅ **MIME Type Validation**: Only images accepted (jpeg, png, webp)
✅ **Automatic Cleanup**: Old thumbnails deleted from R2 when removed
✅ **Progress Tracking**: Optional upload progress callback
✅ **Error Handling**: Comprehensive error messages
✅ **Real Preview**: Admins see thumbnail immediately in form
✅ **Mobile Display**: Users see thumbnails in series list

## Environment Variables

Ensure these are set in `.env`:
```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_api_token_access_key
R2_SECRET_ACCESS_KEY=your_api_token_secret_key
R2_BUCKET_NAME=examroot
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## API Examples

### Generate Presigned URL
```bash
curl -X POST http://localhost:3000/api/test-series/507f1f77bcf86cd799439011/thumbnail-presign \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "physics-series.jpg",
    "contentType": "image/jpeg"
  }'
```

Response:
```json
{
  "success": true,
  "uploadUrl": "https://...r2.cloudflarestorage.com/...?X-Amz-Signature=...",
  "publicUrl": "https://pub-xxx.r2.dev/test-series-thumbnails/uuid.jpg",
  "key": "test-series-thumbnails/uuid.jpg"
}
```

### Save Thumbnail URL
```bash
curl -X PUT http://localhost:3000/api/test-series/507f1f77bcf86cd799439011/thumbnail \
  -H "Content-Type: application/json" \
  -d '{
    "thumbnailUrl": "https://pub-xxx.r2.dev/test-series-thumbnails/uuid.jpg"
  }'
```

### Delete Thumbnail
```bash
curl -X DELETE http://localhost:3000/api/test-series/507f1f77bcf86cd799439011/thumbnail
```

## Validation Rules

- **File Format**: jpeg, png, webp only
- **Max Size**: No explicit limit (can be added in storage settings)
- **Naming**: Auto-generated UUID to prevent collisions
- **Expiry**: Presigned URLs valid for 5 minutes

## Database Schema

### TestSeries Collection
```javascript
{
  _id: ObjectId,
  title: String,
  thumbnail: String, // R2 public URL, default: ""
  // ... other fields
}
```

Example document:
```javascript
{
  _id: ObjectId("..."),
  title: "Physics Test Series",
  thumbnail: "https://pub-xxx.r2.dev/test-series-thumbnails/550e8400-e29b-41d4-a716-446655440000.jpg",
  bookName: "HC Verma",
  // ... other fields
}
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid contentType" | Wrong file format | Use jpeg, png, or webp |
| "Test series not found" | Invalid series ID | Verify series exists |
| "Failed to get presigned URL" | R2 config issue | Check env variables |
| "Upload failed with status" | Direct R2 upload failed | Check file size/network |
| "URL does not belong to this bucket" | Invalid public URL | Use returned publicUrl |

## Future Enhancements

1. **Image Compression**: Auto-compress before upload
2. **Multiple Sizes**: Generate mobile/desktop variants
3. **CDN Cache**: Add cache busting for updated thumbnails
4. **Batch Upload**: Upload multiple thumbnails at once
5. **Image Cropping**: UI for crop before upload
6. **Fallback Image**: Auto-generate if not provided

## Testing

### Unit Tests
```javascript
// Test presigned URL generation
// Test thumbnail save
// Test thumbnail deletion
// Test R2 integration
```

### Manual Testing
1. Create test series from panel
2. Upload thumbnail image
3. Verify preview in form
4. Save series
5. Check mobile app displays thumbnail
6. Edit series - thumbnail should persist
7. Delete thumbnail - should remove from R2
8. Check series list shows thumbnail

## Troubleshooting

**Thumbnail not showing on mobile:**
- Verify R2_PUBLIC_URL is correct
- Check series.thumbnail field in DB
- Verify R2 bucket has public read access

**Upload fails:**
- Check R2 credentials in .env
- Verify file format is supported
- Check file size limits

**Presigned URL expires:**
- Default is 5 minutes - increase if needed
- Client should upload immediately after getting URL

