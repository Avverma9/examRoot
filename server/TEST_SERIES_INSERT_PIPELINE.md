# Test Series Insert Pipeline

This project now uses only the manual `test-series` pipeline.
The AI/OCR auto generator has been removed from the server.

## Collections

- `testseries` from `TestSeries`
- `seriestests` from `SeriesTest`
- `seriesquestions` from `SeriesQuestion`

These are the three collections that store a test series and its nested structure.

## Data Flow

### 1. Series metadata is created first

Endpoint:

- `POST /api/test-series`

Controller:

- `createTestSeries` in [`controllers/testSeriesController.mjs`](./controllers/testSeriesController.mjs)

What happens:

- The request body is read.
- `tests` is removed from the top-level series payload.
- A `TestSeries` document is created first.
- `totalTests` is set from the incoming `tests.length`.

Stored in `TestSeries`:

- `title`
- `description`
- `bookName`
- `author`
- `publisher`
- `subject`
- `category`
- `coverImage`
- `thumbnail`
- `language`
- `isPaid`
- `price`
- `discountedPrice`
- `totalTests`
- `freeTestsCount`
- `tags`
- `isPublished`
- `rating`
- `enrolledCount`

### 2. Tests are normalized

After the series document is created, the controller calls:

- `replaceSeriesTestsWithQuestions(...)`

This function:

- normalizes each test
- trims strings
- converts `duration` and `order` to numbers
- assigns `_id` if missing
- marks `isFree` based on `freeTestsCount`
- keeps questions from the payload

### 3. Existing tests/questions for that series are wiped

Before insert, the function does:

- `SeriesQuestion.deleteMany({ seriesId })`
- `SeriesTest.deleteMany({ seriesId })`

This means the pipeline is replace-based, not patch-based.
If you resend the whole series payload, the old tests/questions for that series are removed and recreated.

### 4. Tests are inserted into `SeriesTest`

For every test in the payload, one document is inserted into `SeriesTest`:

- `seriesId`
- `group`
- `title`
- `description`
- `duration`
- `totalQuestions`
- `isFree`
- `isPublished`
- `order`

Important:

- `totalQuestions` is computed from the number of questions attached to that test.
- `seriesId` links the test back to its parent series.

### 5. Questions are inserted into `SeriesQuestion`

For every question inside a test, one document is inserted into `SeriesQuestion`:

- `seriesId`
- `testId`
- `order`
- `question`
- `questionHi`
- `options`
- `optionsHi`
- `correctAnswer`
- `correctAnswerHi`
- `explanation`
- `explanationHi`

Important:

- `testId` links a question to exactly one test.
- `order` preserves question sequence inside that test.
- The question data is sanitized before insert.

## Insert Order

The server inserts in this sequence:

1. `TestSeries.create(...)`
2. `SeriesTest.deleteMany({ seriesId })`
3. `SeriesQuestion.deleteMany({ seriesId })`
4. `SeriesTest.insertMany(...)`
5. `SeriesQuestion.insertMany(...)`
6. `TestSeries.findByIdAndUpdate(... totalTests ...)` in some add/update flows

## Main APIs

### Create full series

- `POST /api/test-series`

Use this when you want to create a fresh series with tests and questions together.

### Bulk create series

- `POST /api/test-series/bulk`

Uses the same replace pipeline per item in the bulk payload.

### Append tests to an existing series

- `POST /api/test-series/:id/tests/bulk`

This does not delete existing tests.
It only appends new `SeriesTest` and `SeriesQuestion` documents.

### Replace one test's questions

- `PATCH /api/test-series/:id/tests/:testId/questions`

This deletes only that one test's questions and reinserts the updated list.

## Read Flow

### Get series list

- `GET /api/test-series`

Returns only series metadata.
No questions are loaded here.

### Get series detail

- `GET /api/test-series/:id`

Returns tests, and optionally questions when `includeQuestions=true`.

### Get one test with questions

- `GET /api/test-series/:seriesId/test/:testId`

Loads:

- one `SeriesTest`
- all `SeriesQuestion` documents for that test

## Manual Insert Pipeline Summary

The clean mental model is:

`TestSeries` = parent record  
`SeriesTest` = child test records  
`SeriesQuestion` = grandchild question records

So the full pipeline is:

1. Create parent series
2. Create child tests
3. Create question rows for each test
4. Link everything using `seriesId` and `testId`

## Auto Generator Status

Removed from the server:

- `controllers/mcqAutoGeneratorController.mjs`
- `routes/mcqAutoGeneratorRoute.mjs`
- `/mcq-auto-generate` route mount in `routes/index.mjs`

If you want, the next step can be:

- remove unused AI-related dependencies from `package.json`
- add a sample request body for `POST /api/test-series`
- or convert this guide into a cleaner admin-facing API doc
