# Test Series Panel Usage Guide

Yeh guide current panel flow ke according hai.

## 1. Test Series Edit Kaise Kare
1. Test Series page kholo.
2. Jis series ko edit karna hai us row me pen icon click karo.
3. Editor open hote hi basic fields milengi:
- title
- bookName
- subject
- category
- pricing
- tags
- description
4. Jo fields change karni hain karo.
5. Neeche tests section me individual tests add, edit, remove kar sakte ho.
6. Last me Update button click karo.

Notes:
- Existing test ka sirf meta change (group/title/duration/description) fast patch route se hota hai.
- Agar question-level change karna hai to test ko full edit mode me open karke questions modify karo.

## 2. Series Ke Andar Naya Test Add Kaise Kare
1. Editor me Draft Tests section me jao.
2. Test Group, Test Title, Duration, Access fill karo.
3. Question area me question + options + correctAnswer bharo.
4. Add Question click karo.
5. Add Test To Draft click karo.
6. End me Update (existing series) ya Create (new series) click karo.

## 3. Existing Test Me Sirf Group/Title Change (Single Test Meta Edit)
1. Series edit open karo.
2. Test chip ke pen icon se test edit mode me lao.
3. Sirf group/title/duration/description update karo.
4. Update Test In Draft click karo.
5. Last me Update series click karo.

## 4. Mock Aur Practice Generate Kaise Kare
1. Test Series table me row actions use karo.
2. M button = Generate Mock Test.
3. P button = Generate Practice Set.
4. Modal me:
- Title/Description fill karo.
- Test selection optional hai (kuch select nahi karoge to all tests use honge).
- Max questions, shuffle, duration/topic/level set karo.
5. Generate click karo.

## 5. Bulk Series Import Kaise Kare
1. Top me Bulk Import open karo.
2. JSON Array paste karo.
3. Import button click karo.

Minimum working bulk series JSON:

```json
[
  {
    "title": "Lucent GK Test Series",
    "bookName": "Lucent General Knowledge",
    "subject": "General Knowledge",
    "category": "SSC",
    "isPaid": true,
    "price": 299,
    "discountedPrice": 199,
    "freeTestsCount": 1,
    "tests": [
      {
        "group": "History",
        "title": "History Test 1",
        "duration": 30,
        "isFree": true,
        "questions": [
          {
            "question": "Who founded the Maurya Empire?",
            "options": ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
            "correctAnswer": "Chandragupta Maurya",
            "explanation": "Founded around 321 BCE."
          }
        ]
      }
    ]
  }
]
```

## 6. Existing Series Me Bulk Tests Add Kaise Kare
1. Series edit open karo.
2. Draft Tests section me Bulk Tests JSON box me tests ka array paste karo.
3. Import Tests To Draft click karo.
4. End me Update series click karo.

Example:

```json
[
  {
    "group": "Geography",
    "title": "Geography Test 1",
    "description": "Physical Geography",
    "duration": 25,
    "isFree": false,
    "questions": [
      {
        "question": "Which is the highest peak entirely in India?",
        "options": ["Mount Everest", "K2", "Kanchenjunga", "Nanda Devi"],
        "correctAnswer": "Kanchenjunga",
        "explanation": "Kanchenjunga is highest peak entirely within India."
      }
    ]
  },
  {
    "group": "Polity",
    "title": "Polity Test 1",
    "duration": 30,
    "isFree": true,
    "questions": [
      {
        "question": "Which article ensures equality before law?",
        "options": ["14", "19", "21", "32"],
        "correctAnswer": "14",
        "explanation": "Article 14 provides equality before law."
      }
    ]
  }
]
```

## 7. Sirf Single Test Group JSON Se Add Karna
Agar bas ek naya group test add karna hai to array me ek hi object do:

```json
[
  {
    "group": "History",
    "title": "History Test 2",
    "duration": 30,
    "isFree": true,
    "questions": [
      {
        "question": "Battle of Plassey was fought in?",
        "options": ["1757", "1761", "1764", "1775"],
        "correctAnswer": "1757",
        "explanation": "Plassey battle happened in 1757."
      }
    ]
  }
]
```

Yeh current panel ke bulk-test importer me direct kaam karta hai.
