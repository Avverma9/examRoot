# Bulk import templates

Use these files as examples for how to upload bulk data from the admin panel:

- `videos.bulk.json` / `videos.bulk.csv`
- `practiceSets.bulk.json`
- `mockTests.bulk.json`

Notes:
- JSON files should contain an array of objects (or `{ "items": [...] }` / `{ "data": [...] }`).
- For practice sets and mock tests, `questions` is an array (nested data), so JSON is recommended.

