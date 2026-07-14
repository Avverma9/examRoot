# Panel Build Guide (React + Tailwind) with API Contracts

## 1. Goal
Build an admin panel in React + Tailwind that manages:
- Dashboard analytics
- Videos
- Mock Tests
- Practice Sets
- Test Series
- Banners
- AI Question Generation
- R2 Uploads for media

This document is written so you can give it to any AI and get a consistent, production-grade panel with correct flow and API integration.

## 2. Base URL and Environment
Use environment-driven API base URL.

Frontend env variable:
- VITE_API_BASE_URL

Normalization rule already used in current codebase:
- Remove trailing slash
- If URL does not end with /api, append /api

Deployed backend URL evidence in repository:
- https://backend.examroot.cc

Effective deployed API base URL to use in panel:
- https://backend.examroot.cc/api

Local examples:
- http://localhost:5000/api
- http://localhost:3000/api

Important:
- Do not hardcode keys in source.
- Keep Gemini key in env only.

## 3. Recommended Tech and Project Shape
- React 18+
- Vite
- Tailwind CSS
- Redux Toolkit + RTK Query for API state
- React Router for page routing
- Reusable UI primitives (Button, Input, Select, Modal, Table, Badge, Toast)

Suggested folders:
- src/app
- src/pages
- src/components
- src/services
- src/store
- src/utils
- src/styles

## 4. Page Flow Blueprint

### 4.1 Dashboard
- Load cards from admin stats endpoint.
- Load line/bar charts from activity and user-growth endpoints.
- Load top-content lists.

### 4.2 Videos
- List view with search/filter.
- Add/Edit modal or side panel.
- Bulk import support.
- Delete with confirmation.

### 4.3 Mock Tests
- List all tests.
- Create single test.
- Bulk create tests.
- Edit metadata and questions.
- Delete test.

### 4.4 Practice Sets
- Same pattern as mock tests.

### 4.5 Test Series
- Paginated summary list for speed.
- Search with debounce.
- Quick edit path for test metadata using fast PATCH endpoint.
- Full edit path for complete tests/questions.
- Generate Mock and Generate Practice from selected tests.
- Thumbnail upload and save/delete flow.

### 4.6 Banners
- List all banners for admin.
- Create/Update/Delete banner.
- Presign + upload image flow.
- Reorder banners.

### 4.7 Generate Questions
- Mode: image or text source.
- Template-driven JSON output.
- Primary path: server endpoint.
- Optional direct Gemini call supported, but server path is preferred for control and key safety.

## 5. Shared API Response Contract
Most endpoints return:
- success: boolean
- message: string (optional)
- data: object or array (optional)
- total/page/limit/pages for paginated list endpoints

Typical error response:
- success: false
- message: error text

## 6. Endpoint Catalog with Request and Response Payloads

## 6A. Admin Analytics

### GET /admin/stats
Purpose: summary cards on dashboard.

Sample response:
{
  "success": true,
  "data": {
    "totalUsers": 12450,
    "activeToday": 532,
    "activeLast7": 2871,
    "testsAttempted": 98442,
    "practiceAttempted": 51322,
    "videosWatched": 203311,
    "totalVideoViews": 398120,
    "avgAccuracy": 62.4
  }
}

### GET /admin/activity?days=30
Purpose: daily activity chart.

Sample response:
{
  "success": true,
  "data": [
    {
      "date": "2026-07-01",
      "mock_test": 120,
      "practice_set": 90,
      "video": 310,
      "test_series": 45,
      "total": 565
    }
  ]
}

### GET /admin/top-content
Purpose: top videos/tests/practice.

Sample response:
{
  "success": true,
  "data": {
    "topVideos": [
      { "videoTitle": "Algebra Basics", "category": "Math", "views": 12040 }
    ],
    "topTests": [
      { "_id": "id1", "title": "SSC Mock 01", "attempts": 5000, "avgAccuracy": 58.2 }
    ],
    "topPractice": [
      { "_id": "id2", "title": "Polity Practice 01", "completions": 2200 }
    ]
  }
}

### GET /admin/user-growth?days=30
Purpose: new user trend chart.

Sample response:
{
  "success": true,
  "data": [
    { "date": "2026-07-01", "newUsers": 44 }
  ]
}

### POST /admin/generate-questions
Purpose: server-side AI question generation.

Sample request (image mode):
{
  "imageBase64": "data:image/png;base64,AAA...",
  "imageName": "upload.png",
  "targetJson": [
    {
      "title": "History Test",
      "questions": [
        {
          "question": "",
          "questionHi": "",
          "options": ["", "", "", ""],
          "optionsHi": ["", "", "", ""],
          "correctAnswer": "",
          "correctAnswerHi": "",
          "explanation": "",
          "explanationHi": ""
        }
      ]
    }
  ],
  "questionCount": 10,
  "prompt": "Generate chapter-wise MCQs"
}

Sample request (text mode):
{
  "sourceText": "Fundamental Rights are part of Indian Constitution...",
  "targetJson": [
    { "title": "Polity", "questions": [ { "question": "" } ] }
  ],
  "questionCount": 20,
  "prompt": "Create exam level MCQs"
}

Sample response:
{
  "success": true,
  "data": {
    "title": "History Test",
    "questions": [
      {
        "question": "Who founded Maurya Empire?",
        "questionHi": "Maurya samrajya kisne sthapit kiya?",
        "options": ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
        "optionsHi": ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
        "correctAnswer": "Chandragupta Maurya",
        "correctAnswerHi": "Chandragupta Maurya",
        "explanation": "Founded around 321 BCE.",
        "explanationHi": "Lagbhag 321 BCE ke aas-paas sthapit hua."
      }
    ]
  },
  "attempts": [
    { "key": "GEMINI_API_KEY", "model": "gemini-2.0-flash-lite", "status": "success" }
  ]
}

## 6B. Videos

### GET /videos
Purpose: list videos.

Sample response:
{
  "success": true,
  "total": 2,
  "data": [
    {
      "_id": "vid1",
      "title": "Algebra Basics",
      "description": "Intro lesson",
      "videoUrl": "https://cdn.example.com/v/1",
      "thumbnail": "https://cdn.example.com/t/1.jpg",
      "category": "Math",
      "subject": "Algebra",
      "isPremium": false,
      "isPublished": true,
      "duration": 18,
      "views": 1200
    }
  ]
}

### POST /videos
### POST /videos/bulk
### PUT /videos/:id
### DELETE /videos/:id

Sample create/update request:
{
  "title": "Algebra Basics",
  "description": "Linear equations overview",
  "videoUrl": "https://cdn.example.com/v/1",
  "thumbnail": "https://cdn.example.com/t/1.jpg",
  "category": "Math",
  "subject": "Algebra",
  "isPremium": false,
  "isPublished": true,
  "duration": 18
}

Sample success response:
{
  "success": true,
  "message": "Video created/updated",
  "data": { "_id": "vid1", "title": "Algebra Basics" }
}

Bulk request accepted patterns:
- Array body
- Or object wrapper with videos array

## 6C. Mock Tests

### GET /mock
### GET /mock/:id
### POST /mock
### POST /mock/bulk
### PUT /mock/:id
### DELETE /mock/:id

Sample create/update request:
{
  "title": "SSC Mock Test 01",
  "description": "Mixed GK",
  "category": "SSC",
  "duration": 60,
  "isPublished": true,
  "questions": [
    {
      "question": "Capital of India?",
      "options": ["Delhi", "Mumbai", "Kolkata", "Chennai"],
      "correctAnswer": "Delhi",
      "explanation": "Delhi is the capital city."
    }
  ]
}

Sample response:
{
  "success": true,
  "data": {
    "_id": "mock1",
    "title": "SSC Mock Test 01",
    "totalQuestions": 1
  }
}

## 6D. Practice Sets

### GET /practice
### GET /practice/:id
### POST /practice
### POST /practice/bulk
### PUT /practice/:id
### DELETE /practice/:id

Sample create/update request:
{
  "title": "Polity Practice 01",
  "description": "Constitution basics",
  "subject": "Polity",
  "topic": "Fundamental Rights",
  "level": "medium",
  "language": "English",
  "tags": ["upsc", "polity"],
  "isPublished": true,
  "questions": [
    {
      "question": "Which article defines equality before law?",
      "options": ["14", "19", "21", "32"],
      "correctAnswer": "14",
      "explanation": "Article 14 ensures equality before law."
    }
  ]
}

Sample response:
{
  "success": true,
  "data": {
    "_id": "ps1",
    "title": "Polity Practice 01",
    "totalQuestions": 1
  }
}

## 6E. Test Series

### GET /test-series
Key query params:
- includeDrafts=true
- mode=summary
- page=1
- limit=20
- search=keyword
- subject, category, isPaid

Sample response:
{
  "success": true,
  "total": 120,
  "page": 1,
  "limit": 20,
  "pages": 6,
  "data": [
    {
      "_id": "ts1",
      "title": "Lucent GK",
      "bookName": "Lucent GK",
      "subject": "General Knowledge",
      "category": "SSC",
      "isPaid": true,
      "price": 299,
      "discountedPrice": 199,
      "freeTestsCount": 1,
      "totalTests": 25,
      "isPublished": true
    }
  ]
}

### GET /test-series/:id?includeQuestions=true
Purpose: full series detail.

### GET /test-series/:id/tests-meta
Purpose: lightweight test metadata for generate modal.

Sample response:
{
  "success": true,
  "data": {
    "title": "Lucent GK",
    "subject": "General Knowledge",
    "category": "SSC",
    "language": "English",
    "tests": [
      {
        "_id": "t1",
        "title": "History Test 1",
        "description": "Ancient India",
        "totalQuestions": 50
      }
    ]
  }
}

### POST /test-series
### POST /test-series/bulk
### PUT /test-series/:id
### DELETE /test-series/:id

Sample create/update request:
{
  "title": "Lucent GK Test Series",
  "description": "Chapter-wise tests",
  "bookName": "Lucent GK",
  "author": "Lucent Publication",
  "publisher": "Lucent Publication",
  "subject": "General Knowledge",
  "category": "SSC",
  "language": "English",
  "isPaid": true,
  "price": 299,
  "discountedPrice": 199,
  "freeTestsCount": 1,
  "tags": ["lucent", "gk", "ssc"],
  "isPublished": true,
  "tests": [
    {
      "group": "History",
      "title": "History Test 1",
      "description": "Ancient India",
      "duration": 30,
      "isFree": true,
      "isPublished": true,
      "order": 0,
      "questions": [
        {
          "question": "Who founded Maurya Empire?",
          "questionHi": "",
          "options": ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
          "optionsHi": ["", "", "", ""],
          "correctAnswer": "Chandragupta Maurya",
          "correctAnswerHi": "",
          "explanation": "Founded around 321 BCE.",
          "explanationHi": ""
        }
      ]
    }
  ]
}

### PATCH /test-series/:id/tests/:testId/meta
Purpose: fast metadata update for one test without sending full questions.

Sample request:
{
  "group": "History",
  "title": "History Test 1",
  "description": "Ancient India revised",
  "duration": 35,
  "isFree": true,
  "isPublished": true,
  "order": 0
}

Sample response:
{
  "success": true,
  "message": "Test updated successfully",
  "data": {
    "_id": "t1",
    "title": "History Test 1",
    "duration": 35
  }
}

### POST /test-series/:id/generate-mock
Sample request:
{
  "title": "Lucent GK Mock 1",
  "description": "Generated from test series",
  "category": "SSC",
  "duration": 60,
  "maxQuestions": 100,
  "shuffle": true,
  "testIds": ["t1", "t2"]
}

Sample response:
{
  "success": true,
  "message": "Mock test generated",
  "data": {
    "_id": "mock_new_1",
    "title": "Lucent GK Mock 1",
    "totalQuestions": 100
  }
}

### POST /test-series/:id/generate-practice
Sample request:
{
  "title": "Lucent GK Practice 1",
  "description": "Generated from series",
  "subject": "General Knowledge",
  "topic": "History",
  "level": "medium",
  "language": "English",
  "tags": ["gk", "history"],
  "maxQuestions": 80,
  "shuffle": false,
  "testIds": ["t1"]
}

Sample response:
{
  "success": true,
  "message": "Practice set generated",
  "data": {
    "_id": "ps_new_1",
    "title": "Lucent GK Practice 1",
    "totalQuestions": 80
  }
}

### POST /test-series/:id/thumbnail-presign
Sample request:
{
  "filename": "cover.png",
  "contentType": "image/png"
}

Sample response:
{
  "success": true,
  "uploadUrl": "https://...signed-url...",
  "publicUrl": "https://cdn.example.com/thumbnails/key.png",
  "key": "thumbnails/key.png"
}

### PUT /test-series/:id/thumbnail
Sample request:
{
  "thumbnailUrl": "https://cdn.example.com/thumbnails/key.png"
}

Sample response:
{
  "success": true,
  "data": {
    "_id": "ts1",
    "thumbnail": "https://cdn.example.com/thumbnails/key.png"
  }
}

### DELETE /test-series/:id/thumbnail
Sample response:
{
  "success": true,
  "message": "Thumbnail deleted",
  "data": { "_id": "ts1" }
}

## 6F. Banners (Admin)

### GET /banners/admin/all
### POST /banners/admin
### PUT /banners/admin/:id
### DELETE /banners/admin/:id
### POST /banners/admin/presign
### POST /banners/admin/reorder

Sample create/update request:
{
  "title": "SSC Mega Sale",
  "subtitle": "Limited period",
  "imageUrl": "https://cdn.example.com/banners/b1.png",
  "color": "#0f172a",
  "order": 1,
  "isActive": true,
  "link": "/test-series"
}

Sample reorder request:
{
  "banners": [
    { "id": "b1", "order": 1 },
    { "id": "b2", "order": 2 }
  ]
}

Sample response:
{
  "success": true,
  "data": [
    { "_id": "b1", "title": "SSC Mega Sale", "order": 1 }
  ]
}

## 6G. Upload (R2)

### POST /upload/presign
Purpose: get upload URL for direct client PUT.

Sample request:
{
  "type": "thumbnail",
  "filename": "cover.png",
  "contentType": "image/png"
}

Sample response:
{
  "success": true,
  "uploadUrl": "https://...signed-put-url...",
  "publicUrl": "https://cdn.example.com/thumbnails/cover.png",
  "key": "thumbnails/cover.png"
}

### DELETE /upload
Sample request:
{
  "url": "https://cdn.example.com/thumbnails/cover.png"
}

Sample response:
{
  "success": true,
  "message": "Deleted successfully"
}

## 7. AI Build Instructions You Can Paste As-Is
Create a React + Tailwind admin panel with RTK Query and React Router.
Use this API base URL:
- Production: https://backend.examroot.cc/api
- Local: http://localhost:5000/api

Implement pages:
- Dashboard
- Videos
- Mock Tests
- Practice Sets
- Test Series
- Banners
- Generate Questions

Core behavior rules:
- Use paginated summary list for Test Series.
- Use fast PATCH test metadata endpoint for quick edits.
- Use tests-meta endpoint for generate modal test selection.
- Use optimistic UI and toast messages for mutations.
- Show precise server error message from response.message.
- Add form validation before submit.
- Keep layout responsive for desktop and mobile widths.
- Use reusable table, form, modal, and action button components.

## 8. Implementation Notes
- Keep endpoint modules split by domain in src/services.
- Configure cache invalidation tags per domain.
- Debounce search input (300 ms).
- Use skeleton loaders for tables and cards.
- For uploads: presign -> PUT file -> save public URL in entity.
- Never place secret keys directly in code.

## 9. Known Environment Notes
- Current panel .env in workspace points to localhost.
- Production base URL is present in repository references as backend.examroot.cc.
- If you set VITE_API_BASE_URL as https://backend.examroot.cc, normalization will still produce https://backend.examroot.cc/api automatically.
