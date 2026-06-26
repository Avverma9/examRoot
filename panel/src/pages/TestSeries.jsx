import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  useGetAllTestSeriesQuery,
  useGetTestsMetaQuery,
  useCreateTestSeriesMutation,
  useBulkCreateTestSeriesMutation,
  useUpdateTestSeriesMutation,
  useDeleteTestSeriesMutation,
  useGenerateMockTestMutation,
  useGeneratePracticeSetMutation,
} from '../services/testSeriesApi'
import { parseBulkJson } from '../utils/bulkImport'

const emptyQuestion = {
  question: '',
  questionHi: '',
  options: ['', '', '', ''],
  optionsHi: ['', '', '', ''],
  correctAnswer: '',
  correctAnswerHi: '',
  explanation: '',
  explanationHi: '',
}

const emptyTest = {
  title: '',
  description: '',
  duration: 60,
  questions: [],
  totalQuestions: 0,
  isFree: false,
  isPublished: true,
  order: 0,
}

const emptySeries = {
  title: '',
  description: '',
  bookName: '',
  author: '',
  publisher: '',
  subject: '',
  category: '',
  coverImage: '',
  language: 'English',
  isPaid: false,
  price: 0,
  discountedPrice: 0,
  totalTests: 0,
  tests: [],
  freeTestsCount: 1,
  tags: '',
  isPublished: true,
}

export default function TestSeries() {
  const { data, isLoading, isError, refetch } = useGetAllTestSeriesQuery()
  const [createTestSeries] = useCreateTestSeriesMutation()
  const [bulkCreateTestSeries, { isLoading: isBulkLoading }] = useBulkCreateTestSeriesMutation()
  const [updateTestSeries] = useUpdateTestSeriesMutation()
  const [deleteTestSeries] = useDeleteTestSeriesMutation()
  const [generateMockTest, { isLoading: isMockGenerating }] = useGenerateMockTestMutation()
  const [generatePracticeSet, { isLoading: isPracticeGenerating }] = useGeneratePracticeSetMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptySeries)
  const [testInput, setTestInput] = useState(emptyTest)
  const [questionInput, setQuestionInput] = useState(emptyQuestion)
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkError, setBulkError] = useState('')
  const [bulkInfo, setBulkInfo] = useState('')

  // ─── Generate modal state ─────────────────────────────────────────────────
  const [generateModal, setGenerateModal] = useState(null) // { seriesId, seriesTitle, type: 'mock'|'practice' }
  const [genForm, setGenForm] = useState({
    title: '', description: '', duration: 60,
    category: '', subject: '', topic: '',
    level: 'medium', language: 'English',
    maxQuestions: '', shuffle: true,
    selectedTestIds: [],   // [] = all tests
    tags: '',
  })
  const [genResult, setGenResult] = useState(null)
  const [genError, setGenError] = useState('')

  const seriesList = data?.data || []

  // ─── Generate modal helpers ───────────────────────────────────────────────
  const openGenerateModal = (series, type) => {
    setGenForm({
      title: `${series.title} — ${type === 'mock' ? 'Mock Test' : 'Practice Set'}`,
      description: `Generated from ${series.bookName}`,
      duration: 60,
      category: series.category || '',
      subject: series.subject || '',
      topic: '',
      level: 'medium',
      language: series.language || 'English',
      maxQuestions: '',
      shuffle: type === 'mock',
      selectedTestIds: [],
      tags: '',
    })
    setGenResult(null)
    setGenError('')
    setGenerateModal({ seriesId: series._id, seriesTitle: series.title, tests: series.tests || [], type })
  }

  const closeGenerateModal = () => {
    setGenerateModal(null)
    setGenResult(null)
    setGenError('')
  }

  const handleGenerate = async () => {
    setGenError('')
    setGenResult(null)
    if (!genForm.title.trim()) return setGenError('Title is required')
    if (generateModal.type === 'mock' && !genForm.duration) return setGenError('Duration is required')

    const payload = {
      seriesId: generateModal.seriesId,
      title: genForm.title.trim(),
      description: genForm.description.trim(),
      shuffle: genForm.shuffle,
      ...(genForm.maxQuestions ? { maxQuestions: Number(genForm.maxQuestions) } : {}),
      ...(genForm.selectedTestIds.length ? { testIds: genForm.selectedTestIds } : {}),
    }

    try {
      let result
      if (generateModal.type === 'mock') {
        result = await generateMockTest({
          ...payload,
          category: genForm.category,
          duration: Number(genForm.duration),
        }).unwrap()
      } else {
        result = await generatePracticeSet({
          ...payload,
          subject: genForm.subject,
          topic: genForm.topic,
          level: genForm.level,
          language: genForm.language,
          tags: genForm.tags ? genForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }).unwrap()
      }
      setGenResult(result)
    } catch (err) {
      setGenError(err.data?.message || err.message || 'Generation failed')
    }
  }

  const toggleTestId = (id) => {
    setGenForm(prev => ({
      ...prev,
      selectedTestIds: prev.selectedTestIds.includes(id)
        ? prev.selectedTestIds.filter(x => x !== id)
        : [...prev.selectedTestIds, id],
    }))
  }

  const bulkExample = `[
  {
    "title": "Lucent GK Test Series",
    "description": "Lucent's General Knowledge book ke sabhi chapters ke chapter-wise tests. SSC, Railway, UPSC ke liye best.",
    "bookName": "Lucent's General Knowledge",
    "author": "Lucent Publication",
    "publisher": "Lucent Publication",
    "subject": "General Knowledge",
    "category": "SSC",
    "language": "Hindi + English",
    "isPaid": true,
    "price": 299,
    "discountedPrice": 199,
    "freeTestsCount": 1,
    "tags": ["lucent", "gk", "ssc", "railway", "history"],
    "isPublished": true,
    "tests": [
      {
        "title": "History Test Series - 1",
        "description": "History Page 1-3 | Ancient India",
        "duration": 30,
        "isFree": true,
        "isPublished": true,
        "questions": [
          {
            "question": "Who founded the Maurya Empire?",
            "questionHi": "मौर्य साम्राज्य की स्थापना किसने की?",
            "options": ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
            "optionsHi": ["अशोक", "चंद्रगुप्त मौर्य", "बिंदुसार", "बिंबिसार"],
            "correctAnswer": "Chandragupta Maurya",
            "correctAnswerHi": "चंद्रगुप्त मौर्य",
            "explanation": "Chandragupta Maurya founded the Maurya Empire around 321 BC with help of Chanakya.",
            "explanationHi": "चंद्रगुप्त मौर्य ने चाणक्य की सहायता से लगभग 321 ईसा पूर्व में मौर्य साम्राज्य की स्थापना की।"
          },
          {
            "question": "The Battle of Plassey was fought in which year?",
            "questionHi": "प्लासी का युद्ध किस वर्ष लड़ा गया था?",
            "options": ["1757", "1761", "1764", "1775"],
            "optionsHi": ["1757", "1761", "1764", "1775"],
            "correctAnswer": "1757",
            "correctAnswerHi": "1757",
            "explanation": "The Battle of Plassey was fought on 23 June 1757 between the British East India Company and Nawab of Bengal.",
            "explanationHi": "प्लासी का युद्ध 23 जून 1757 को ब्रिटिश ईस्ट इंडिया कंपनी और बंगाल के नवाब के बीच लड़ा गया था।"
          },
          {
            "question": "Ashoka's Dhamma was written in which language?",
            "questionHi": "अशोक के धम्म किस भाषा में लिखे गए थे?",
            "options": ["Sanskrit", "Pali", "Prakrit", "Hindi"],
            "optionsHi": ["संस्कृत", "पालि", "प्राकृत", "हिंदी"],
            "correctAnswer": "Pali",
            "correctAnswerHi": "पालि",
            "explanation": "Ashoka's edicts were primarily written in Pali language using Brahmi script.",
            "explanationHi": "अशोक के शिलालेख मुख्यतः ब्राह्मी लिपि में पालि भाषा में लिखे गए थे।"
          }
        ]
      },
      {
        "title": "History Test Series - 2",
        "description": "History Page 4-6 | Medieval India",
        "duration": 30,
        "isFree": false,
        "isPublished": true,
        "questions": [
          {
            "question": "Who built the Qutub Minar?",
            "questionHi": "कुतुब मीनार का निर्माण किसने कराया?",
            "options": ["Akbar", "Qutb ud-Din Aibak", "Humayun", "Aurangzeb"],
            "optionsHi": ["अकबर", "कुतुबुद्दीन ऐबक", "हुमायूँ", "औरंगजेब"],
            "correctAnswer": "Qutb ud-Din Aibak",
            "correctAnswerHi": "कुतुबुद्दीन ऐबक",
            "explanation": "Qutb ud-Din Aibak began the construction of Qutub Minar in 1193 AD.",
            "explanationHi": "कुतुबुद्दीन ऐबक ने 1193 ईस्वी में कुतुब मीनार का निर्माण शुरू करवाया था।"
          },
          {
            "question": "Akbar introduced the Din-i-Ilahi religion in which year?",
            "questionHi": "अकबर ने दीन-ए-इलाही धर्म की शुरुआत किस वर्ष में की?",
            "options": ["1570", "1575", "1582", "1590"],
            "optionsHi": ["1570", "1575", "1582", "1590"],
            "correctAnswer": "1582",
            "correctAnswerHi": "1582",
            "explanation": "Akbar introduced the Din-i-Ilahi in 1582, a syncretic religion blending elements of multiple faiths.",
            "explanationHi": "अकबर ने 1582 में दीन-ए-इलाही की स्थापना की, जो कई धर्मों के तत्वों को मिलाकर बनाया गया एक समन्वयवादी धर्म था।"
          }
        ]
      },
      {
        "title": "Geography Test Series - 1",
        "description": "Geography Page 10-12 | Physical Geography of India",
        "duration": 25,
        "isFree": false,
        "isPublished": true,
        "questions": [
          {
            "question": "Which is the highest peak in India?",
            "questionHi": "भारत की सबसे ऊँची चोटी कौन सी है?",
            "options": ["Mount Everest", "K2", "Kanchenjunga", "Nanda Devi"],
            "optionsHi": ["माउंट एवरेस्ट", "K2", "कंचनजंगा", "नंदा देवी"],
            "correctAnswer": "Kanchenjunga",
            "correctAnswerHi": "कंचनजंगा",
            "explanation": "Kanchenjunga (8,586 m) is the highest peak entirely within India.",
            "explanationHi": "कंचनजंगा (8,586 मीटर) पूरी तरह से भारत के भीतर स्थित सबसे ऊँची चोटी है।"
          },
          {
            "question": "The river Ganga originates from which glacier?",
            "questionHi": "गंगा नदी किस ग्लेशियर से निकलती है?",
            "options": ["Siachen", "Gangotri", "Zemu", "Milam"],
            "optionsHi": ["सियाचिन", "गंगोत्री", "जेमू", "मिलम"],
            "correctAnswer": "Gangotri",
            "correctAnswerHi": "गंगोत्री",
            "explanation": "The Ganga river originates from the Gangotri glacier in Uttarakhand.",
            "explanationHi": "गंगा नदी उत्तराखंड में गंगोत्री ग्लेशियर से निकलती है।"
          }
        ]
      }
    ]
  }
]`

  const copyToClipboard = async (text) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  const resetForm = () => {
    setForm(emptySeries)
    setTestInput(emptyTest)
    setQuestionInput(emptyQuestion)
    setEditingId(null)
    setShowForm(false)
  }

  const normalizeForm = () => ({
    ...form,
    totalTests: form.tests.length,
    tags: typeof form.tags === 'string'
      ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : form.tags,
    tests: form.tests.map((test, index) => ({
      ...test,
      order: test.order ?? index,
      totalQuestions: test.questions?.length || 0,
    })),
  })

  const handleBulkImport = async () => {
    setBulkError('')
    setBulkResult(null)
    setBulkInfo('')
    if (!bulkText.trim()) {
      setBulkError('Please paste JSON array first')
      return
    }

    try {
      const items = parseBulkJson(bulkText)
      const result = await bulkCreateTestSeries(items).unwrap()
      setBulkResult(result)
      setBulkText('')
      refetch()
    } catch (err) {
      setBulkError(err.data?.message || err.message || 'Bulk import failed')
    }
  }

  const addQuestionToTest = () => {
    if (!questionInput.question || !questionInput.correctAnswer) return
    const questions = [...testInput.questions, { ...questionInput }]
    setTestInput({ ...testInput, questions, totalQuestions: questions.length })
    setQuestionInput(emptyQuestion)
  }

  const removeQuestionFromTest = (index) => {
    const questions = testInput.questions.filter((_, i) => i !== index)
    setTestInput({ ...testInput, questions, totalQuestions: questions.length })
  }

  const addTest = () => {
    if (!testInput.title || testInput.questions.length === 0) return
    const tests = [
      ...form.tests,
      {
        ...testInput,
        order: form.tests.length,
        totalQuestions: testInput.questions.length,
      },
    ]
    setForm({ ...form, tests, totalTests: tests.length })
    setTestInput(emptyTest)
    setQuestionInput(emptyQuestion)
  }

  const removeTest = (index) => {
    const tests = form.tests.filter((_, i) => i !== index).map((test, i) => ({ ...test, order: i }))
    setForm({ ...form, tests, totalTests: tests.length })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = normalizeForm()
      if (editingId) {
        await updateTestSeries({ id: editingId, ...payload }).unwrap()
      } else {
        await createTestSeries(payload).unwrap()
      }
      resetForm()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  const handleEdit = (series) => {
    setForm({
      ...emptySeries,
      ...series,
      tags: (series.tags || []).join(', '),
      tests: series.tests || [],
      isPublished: series.isPublished !== false,
      isPaid: series.isPaid === true,
    })
    setEditingId(series._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this test series?')) return
    try {
      await deleteTestSeries(id).unwrap()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message="Failed to load test series" />

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Test Series</h1>
          <p className="page-subtitle">Manage book based test series</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fa-solid fa-plus"></i> {showForm ? 'Cancel' : 'Add Series'}
        </button>
      </div>

      <div className="form-card">
        <h3>Bulk Import</h3>
        <p className="page-subtitle">Paste JSON array with book details, tests, and questions.</p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setBulkText(bulkExample)
              setBulkInfo('✅ Example loaded in textarea below — edit karo ya seedha Import karo')
              setBulkError('')
              setBulkResult(null)
            }}
          >
            <i className="fa-solid fa-eye"></i> See Example
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              try {
                await copyToClipboard(bulkExample)
                setBulkInfo('✅ Example JSON clipboard me copy ho gaya!')
                setBulkError('')
              } catch (e) {
                setBulkError('Copy failed: ' + (e.message || 'Unknown error'))
              }
            }}
          >
            <i className="fa-solid fa-copy"></i> Copy Example
          </button>
        </div>
        <div className="form-group full">
          <label>JSON Array</label>
          <textarea
            rows={12}
            value={bulkText}
            onChange={(e) => { setBulkText(e.target.value); setBulkInfo(''); setBulkResult(null); setBulkError('') }}
            placeholder={`Paste karo ya "See Example" click karo:\n[\n  {\n    "title": "Lucent GK Test Series",\n    "bookName": "Lucent's General Knowledge",\n    "subject": "General Knowledge",\n    "category": "SSC",\n    "tests": [\n      {\n        "title": "History Test Series - 1",\n        "description": "History Page 1-3",\n        "duration": 30,\n        "isFree": true,\n        "questions": [\n          {\n            "question": "...",\n            "options": ["A","B","C","D"],\n            "correctAnswer": "A",\n            "explanation": "..."\n          }\n        ]\n      }\n    ]\n  }\n]`}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleBulkImport}
          disabled={isBulkLoading}
        >
          {isBulkLoading ? 'Importing...' : 'Import'}
        </button>
        {bulkError && <div className="error-text">{bulkError}</div>}
        {bulkInfo && <div className="success-text">{bulkInfo}</div>}
        {bulkResult?.totalInserted != null && (
          <div className="success-text">
            Imported {bulkResult.totalInserted} item(s)
            {bulkResult.totalReceived != null ? ` out of ${bulkResult.totalReceived}` : ''}.
          </div>
        )}
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Test Series' : 'Add New Test Series'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Series Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Book Name</label>
              <input value={form.bookName} onChange={(e) => setForm({ ...form, bookName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Publisher</label>
              <input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Language</label>
              <input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Cover Image URL</label>
              <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.value === 'true' })}>
                <option value="false">Free</option>
                <option value="true">Paid</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Discounted Price</label>
              <input type="number" min="0" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Free Tests Count</label>
              <input type="number" min="0" value={form.freeTestsCount} onChange={(e) => setForm({ ...form, freeTestsCount: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.value === 'true' })}>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tags</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ssc, maths, book" />
            </div>
          </div>
          <div className="form-group full">
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="question-builder">
            <h4>Build Test ({form.tests.length} tests added)</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Test Title</label>
                <input value={testInput.title} onChange={(e) => setTestInput({ ...testInput, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input type="number" min="1" value={testInput.duration} onChange={(e) => setTestInput({ ...testInput, duration: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Test Access</label>
                <select value={testInput.isFree} onChange={(e) => setTestInput({ ...testInput, isFree: e.target.value === 'true' })}>
                  <option value="false">Paid/Locked</option>
                  <option value="true">Free</option>
                </select>
              </div>
              <div className="form-group">
                <label>Test Status</label>
                <select value={testInput.isPublished} onChange={(e) => setTestInput({ ...testInput, isPublished: e.target.value === 'true' })}>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>
            </div>
            <div className="form-group full">
              <label>Test Description</label>
              <textarea rows={2} value={testInput.description} onChange={(e) => setTestInput({ ...testInput, description: e.target.value })} />
            </div>

            <div className="form-group full">
              <label>Question</label>
              <input value={questionInput.question} onChange={(e) => setQuestionInput({ ...questionInput, question: e.target.value })} />
            </div>
            <div className="form-grid">
              {questionInput.options.map((option, index) => (
                <div className="form-group" key={index}>
                  <label>Option {String.fromCharCode(65 + index)}</label>
                  <input
                    value={option}
                    onChange={(e) => {
                      const options = [...questionInput.options]
                      options[index] = e.target.value
                      setQuestionInput({ ...questionInput, options })
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Correct Answer</label>
                <input value={questionInput.correctAnswer} onChange={(e) => setQuestionInput({ ...questionInput, correctAnswer: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Explanation</label>
                <input value={questionInput.explanation} onChange={(e) => setQuestionInput({ ...questionInput, explanation: e.target.value })} />
              </div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={addQuestionToTest}>
              <i className="fa-solid fa-plus"></i> Add Question
            </button>

            {testInput.questions.length > 0 && (
              <div className="question-list">
                {testInput.questions.map((question, index) => (
                  <div className="question-chip" key={index}>
                    <span>Q{index + 1}: {question.question.slice(0, 40)}...</span>
                    <button type="button" onClick={() => removeQuestionFromTest(index)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={addTest}>
                <i className="fa-solid fa-plus"></i> Add Test To Series
              </button>
            </div>

            {form.tests.length > 0 && (
              <div className="question-list">
                {form.tests.map((test, index) => (
                  <div className="question-chip" key={`${test.title}-${index}`}>
                    <span>{index + 1}. {test.title} ({test.questions?.length || 0} questions)</span>
                    <button type="button" onClick={() => removeTest(index)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      )}

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Series</th>
                <th>Book</th>
                <th>Subject</th>
                <th>Tests</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {seriesList.map((series) => (
                <tr key={series._id}>
                  <td>
                    <div className="cell-title">{series.title}</div>
                  </td>
                  <td>{series.bookName}</td>
                  <td>{series.subject}</td>
                  <td>{series.totalTests || series.tests?.length || 0}</td>
                  <td>{series.isPaid ? `Rs. ${series.discountedPrice || series.price || 0}` : 'Free'}</td>
                  <td>
                    <span className={`status-badge ${series.isPublished !== false ? 'published' : 'draft'}`}>
                      {series.isPublished !== false ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-generate-mock"
                        onClick={() => openGenerateModal(series, 'mock')}
                        title="Generate Mock Test"
                      >
                        ⚡
                      </button>
                      <button
                        className="btn-icon btn-generate-practice"
                        onClick={() => openGenerateModal(series, 'practice')}
                        title="Generate Practice Set"
                      >
                        📝
                      </button>
                      <button className="btn-icon btn-edit" onClick={() => handleEdit(series)} title="Edit">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(series._id)} title="Delete">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {seriesList.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-text">No test series found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── GENERATE MODAL ─────────────────────────────────────────────────── */}
      {generateModal && (
        <div className="modal-overlay" onClick={closeGenerateModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {generateModal.type === 'mock' ? '⚡ Generate Mock Test' : '📝 Generate Practice Set'}
                </h3>
                <p className="modal-subtitle">Source: {generateModal.seriesTitle}</p>
              </div>
              <button className="modal-close" onClick={closeGenerateModal}>✕</button>
            </div>

            {/* Success state */}
            {genResult ? (
              <div className="gen-success">
                <div className="gen-success-icon">✅</div>
                <h4>{genResult.message}</h4>
                <p><strong>Title:</strong> {genResult.data?.title}</p>
                <p><strong>Questions:</strong> {genResult.data?.totalQuestions}</p>
                {generateModal.type === 'mock' && <p><strong>Duration:</strong> {genResult.data?.duration} min</p>}
                <p><strong>Category/Subject:</strong> {genResult.data?.category || genResult.data?.subject}</p>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeGenerateModal}>Close</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setGenResult(null)
                      setGenForm(f => ({ ...f, title: '' }))
                    }}
                  >
                    Generate Another
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Select Tests */}
                <div className="gen-section">
                  <label className="gen-label">
                    Select Tests to include
                    <span className="gen-label-hint">
                      {genForm.selectedTestIds.length === 0
                        ? ' — All tests selected'
                        : ` — ${genForm.selectedTestIds.length} selected`}
                    </span>
                  </label>
                  <div className="gen-test-list">
                    {generateModal.tests.map((t) => {
                      const checked = genForm.selectedTestIds.length === 0 || genForm.selectedTestIds.includes(String(t._id))
                      return (
                        <label key={t._id} className="gen-test-item">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTestId(String(t._id))}
                          />
                          <span className="gen-test-name">{t.title}</span>
                          <span className="gen-test-count">
                            {t.totalQuestions || 0} Qs
                            {t.description ? ` • ${t.description}` : ''}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Common fields */}
                <div className="gen-section">
                  <div className="form-group full">
                    <label>Title *</label>
                    <input
                      value={genForm.title}
                      onChange={(e) => setGenForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Lucent GK — History Mock Test"
                    />
                  </div>
                  <div className="form-group full">
                    <label>Description</label>
                    <input
                      value={genForm.description}
                      onChange={(e) => setGenForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Max Questions <span className="gen-label-hint">(blank = all)</span></label>
                      <input
                        type="number" min="1"
                        value={genForm.maxQuestions}
                        onChange={(e) => setGenForm(f => ({ ...f, maxQuestions: e.target.value }))}
                        placeholder="e.g. 50"
                      />
                    </div>
                    {generateModal.type === 'mock' && (
                      <div className="form-group">
                        <label>Duration (minutes) *</label>
                        <input
                          type="number" min="1"
                          value={genForm.duration}
                          onChange={(e) => setGenForm(f => ({ ...f, duration: e.target.value }))}
                        />
                      </div>
                    )}
                    {generateModal.type === 'mock' && (
                      <div className="form-group">
                        <label>Category</label>
                        <input
                          value={genForm.category}
                          onChange={(e) => setGenForm(f => ({ ...f, category: e.target.value }))}
                        />
                      </div>
                    )}
                    {generateModal.type === 'practice' && (
                      <div className="form-group">
                        <label>Subject</label>
                        <input
                          value={genForm.subject}
                          onChange={(e) => setGenForm(f => ({ ...f, subject: e.target.value }))}
                        />
                      </div>
                    )}
                    {generateModal.type === 'practice' && (
                      <div className="form-group">
                        <label>Topic</label>
                        <input
                          value={genForm.topic}
                          onChange={(e) => setGenForm(f => ({ ...f, topic: e.target.value }))}
                          placeholder="e.g. Ancient History"
                        />
                      </div>
                    )}
                    {generateModal.type === 'practice' && (
                      <div className="form-group">
                        <label>Difficulty Level</label>
                        <select value={genForm.level} onChange={(e) => setGenForm(f => ({ ...f, level: e.target.value }))}>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    )}
                    {generateModal.type === 'practice' && (
                      <div className="form-group">
                        <label>Language</label>
                        <input
                          value={genForm.language}
                          onChange={(e) => setGenForm(f => ({ ...f, language: e.target.value }))}
                        />
                      </div>
                    )}
                    {generateModal.type === 'practice' && (
                      <div className="form-group">
                        <label>Tags <span className="gen-label-hint">(comma separated)</span></label>
                        <input
                          value={genForm.tags}
                          onChange={(e) => setGenForm(f => ({ ...f, tags: e.target.value }))}
                          placeholder="gk, history, lucent"
                        />
                      </div>
                    )}
                  </div>

                  <label className="gen-shuffle-row">
                    <input
                      type="checkbox"
                      checked={genForm.shuffle}
                      onChange={(e) => setGenForm(f => ({ ...f, shuffle: e.target.checked }))}
                    />
                    <span>Shuffle questions randomly</span>
                  </label>
                </div>

                {genError && <div className="error-text">{genError}</div>}

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeGenerateModal}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={isMockGenerating || isPracticeGenerating}
                  >
                    {(isMockGenerating || isPracticeGenerating)
                      ? 'Generating...'
                      : generateModal.type === 'mock'
                        ? '⚡ Generate Mock Test'
                        : '📝 Generate Practice Set'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
