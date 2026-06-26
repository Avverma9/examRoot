# Bulk import templates

Use these files as examples for how to upload bulk data from the admin panel:

- `videos.bulk.json` / `videos.bulk.csv`
- `practiceSets.bulk.json`
- `mockTests.bulk.json`
- `testSeries.bulk.json` ← **Test Series (Book → Tests → Questions)**

## Notes
- JSON files should contain an array of objects (or `{ "items": [...] }` / `{ "data": [...] }`).
- For practice sets and mock tests, `questions` is an array (nested data), so JSON is recommended.

## Test Series JSON Structure

```
[                             ← Array of series (parent books)
  {
    title,                    ← Book ki series ka naam  (e.g. "Lucent GK Test Series")
    bookName,                 ← Actual book name         (e.g. "Lucent's General Knowledge")
    subject, category,        ← Required fields
    isPaid, price,            ← Pricing
    freeTestsCount,           ← Kitne tests free honge (index 0 se)
    tests: [                  ← Array of tests (child)
      {
        title,                ← Test title  (e.g. "History Test Series - 1")
        description,          ← Pages / topic (e.g. "History Page 1-3")
        duration,             ← Minutes
        isFree,               ← true = free, false = locked
        questions: [          ← Array of questions
          {
            question,         ← English question text
            questionHi,       ← Hindi (optional)
            options,          ← ["A","B","C","D"]
            optionsHi,        ← Hindi options (optional)
            correctAnswer,    ← Must exactly match one option
            correctAnswerHi,  ← Hindi correct answer (optional)
            explanation,      ← English explanation (optional)
            explanationHi     ← Hindi explanation (optional)
          }
        ]
      }
    ]
  }
]
```

