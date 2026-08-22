# Test Series Question Grouping Rules

यह document अभी चल रहे Test Series pipeline का source-of-truth है। इसमें question grouping, save/update stages और database में data जाने का क्रम दिया गया है।

## सबसे जरूरी बात

अभी `group` सीधे question पर नहीं लगा है। `group` एक **test-level field** है और `SeriesTest` document में save होता है। Questions किसी अलग group collection में नहीं जाते; वे `testId` के माध्यम से एक test के अंदर group होते हैं।

```text
TestSeries (parent series)
  └── SeriesTest (test + group)
        └── SeriesQuestion (questions, linked by testId)
```

इसलिए किसी question का effective grouping है:

```text
seriesId + testId
```

और test का displayed subject/topic grouping है:

```text
SeriesTest.group
```

## Current pipeline stages

### Stage 1: Panel में input/draft बनना

Admin panel में test के साथ ये information तैयार होती है:

- `group`
- `title`
- `description`
- `duration`
- `isFree`
- `isPublished`
- `order`
- `questions[]`

Questions manually add की जा सकती हैं या JSON bulk import से लाई जा सकती हैं। Bulk import में यदि पूरा test object आता है तो उसका `group` और `questions[]` साथ में लिए जाते हैं। केवल questions आने पर वे selected test के draft में append होते हैं।

### Stage 2: Payload normalization

Backend `normalizeIncomingTests()` में input को normalize करता है:

- strings trim होती हैं;
- `duration` और `order` numbers में convert होते हैं;
- missing test `_id` के लिए नया ObjectId बनाया जाता है;
- `group` string के रूप में रखा जाता है;
- `isFree` पहले `freeTestsCount` के आधार पर set होता है;
- questions को `sanitizeQuestion()` से clean किया जाता है;
- question arrays को test के साथ preserve किया जाता है।

Question से ये fields रखे जाते हैं:

`question`, `questionHi`, `options`, `optionsHi`, `correctAnswer`, `correctAnswerHi`, `explanation`, `explanationHi`.

### Stage 3: Test document तैयार होना

हर incoming test से एक `SeriesTest` document बनता है। इसमें मुख्य linking और grouping fields हैं:

- `seriesId` — parent `TestSeries` से link;
- `group` — test का subject/topic group;
- `title`, `description`, `duration`;
- `totalQuestions` — उसी test के questions की actual count;
- `isFree`, `isPublished`, `order`.

### Stage 4: Question documents बनना

हर test के `questions[]` में से हर question का एक `SeriesQuestion` document बनता है। प्रत्येक question में:

- `seriesId` — series से link;
- `testId` — exact test से link;
- `order` — test के अंदर question क्रम, zero-based;
- sanitized question content.

यही stage actual question grouping करती है। समान `testId` वाले सभी questions एक ही test group में माने जाते हैं।

### Stage 5: Database insert

Full create/replace flow का क्रम यह है:

1. `TestSeries` parent create होता है;
2. उस series के पुराने `SeriesQuestion` delete होते हैं;
3. उस series के पुराने `SeriesTest` delete होते हैं;
4. नए `SeriesTest` documents insert होते हैं;
5. नए `SeriesQuestion` documents insert होते हैं;
6. series का `totalTests` current test count के अनुसार shape/read response में दिखाया जाता है।

यह full create pipeline **replace-based** है। पूरे series payload को दोबारा भेजने पर उसके पुराने tests और questions हटकर फिर से insert होते हैं।

## New series और existing series का फर्क

### New series

Panel पहले tests/questions को local draft में रखता है। Save पर:

```text
POST /api/test-series
```

एक ही payload में series metadata, tests और questions जाते हैं। Backend ऊपर दिए गए full create pipeline से records बनाता है।

### Existing series में नया test जोड़ना

Existing tests को छुए बिना नया test और उसके questions add होते हैं:

```text
POST /api/test-series/:seriesId/tests/bulk
```

इस flow में:

- पुराने tests/questions delete नहीं होते;
- नए test का `order` existing test count के बाद set होता है;
- नए questions को नए `testId` से link किया जाता है;
- `TestSeries.totalTests` फिर से count किया जाता है।

### Existing test का group/title बदलना

केवल test metadata update होता है:

```text
PATCH /api/test-series/:seriesId/tests/:testId/meta
```

Allowed metadata में `group`, `title`, `description`, `duration`, `isFree`, `isPublished` और `order` हैं। इस endpoint से questions touch नहीं होते।

### Existing test के questions बदलना

केवल उसी test के questions replace होते हैं:

```text
PATCH /api/test-series/:seriesId/tests/:testId/questions
```

क्रम:

1. test validate होता है;
2. उसी `seriesId + testId` के पुराने questions delete होते हैं;
3. नए questions sanitize होकर insert होते हैं;
4. `SeriesTest.totalQuestions` नई count से update होता है।

दूसरे tests के questions इस flow में प्रभावित नहीं होते।

## Read/display pipeline

### Series list

```text
GET /api/test-series
```

यह series metadata/list देता है; questions load नहीं होते।

### Series detail

```text
GET /api/test-series/:id?includeQuestions=true
```

पहले tests `order` से load होते हैं। फिर questions `seriesId` और test IDs से load होकर `testId` पर map किए जाते हैं और `order` से sort होते हैं। Response में हर test के अंदर उसका `questions[]` बनाया जाता है।

### Test player

```text
GET /api/test-series/:seriesId/test/:testId
```

यह exact `SeriesTest` और उसके `SeriesQuestion` records load करता है। Paid series में access check के बाद questions return होते हैं। Free test या active subscription होने पर player को questions मिलते हैं।

## Current safety rules

1. Series metadata update (`PUT /api/test-series/:id`) में `tests` field ignore होती है। इससे title/price edit करते समय पूरा test-question tree replace नहीं होता।
2. Existing series में नया test जोड़ने के लिए केवल `/tests/bulk` append endpoint use करना है।
3. Existing test के group/title और questions को अलग-अलग operations मानना है: metadata के लिए `/meta`, questions के लिए `/questions`.
4. हर question का `testId` उसी test का होना चाहिए; इसी से grouping सुरक्षित रहती है।
5. Question order test के अंदर `0, 1, 2...` से recreate होता है।
6. `totalQuestions` client के भेजे हुए value पर भरोसा नहीं करता; backend questions array की length से count बनाता है।
7. Test delete होने पर उसके `SeriesQuestion` records भी delete होते हैं।
8. पूरी series delete होने पर parent के साथ उसके सभी tests और questions भी delete होते हैं।

## Short summary

```text
Panel draft/import
  → normalize test + sanitize questions
  → assign seriesId/testId/order
  → save SeriesTest (group सहित)
  → save SeriesQuestion (testId सहित)
  → read में testId पर questions regroup
  → player में ordered questions serve
```

अर्थात current system में “question group” का वास्तविक unit `SeriesTest` है, और `group` केवल उस test की labeling/category है।
