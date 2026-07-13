import { useEffect, useMemo, useRef, useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  useGetAllTestSeriesQuery,
  useLazyGetTestsMetaQuery,
  useLazyGetTestSeriesByIdQuery,
  useCreateTestSeriesMutation,
  useBulkCreateTestSeriesMutation,
  useUpdateTestSeriesMutation,
  useUpdateTestSeriesTestMetaMutation,
  useDeleteTestSeriesMutation,
  useGenerateMockTestMutation,
  useGeneratePracticeSetMutation,
} from '../services/testSeriesApi'
import { parseBulkJson } from '../utils/bulkImport'

const emptyQuestion = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
  questionHi: '',
  optionsHi: ['', '', '', ''],
  correctAnswerHi: '',
  explanationHi: '',
}

const emptyTest = {
  group: '',
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

const bulkExample = `[
  {
    "title": "Lucent GK Test Series",
    "bookName": "Lucent's General Knowledge",
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
]`

const testBulkExample = `[
  {
    "group": "History",
    "title": "History Test - 1",
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
]`

const getErrorMessage = (error) => (
  error?.data?.message
  || error?.data?.error
  || error?.error
  || error?.message
  || 'Unexpected server error'
)

const mapSeriesToForm = (series) => ({
  ...emptySeries,
  ...series,
  tags: Array.isArray(series?.tags) ? series.tags.join(', ') : (series?.tags || ''),
  tests: (series?.tests || []).map((test, index) => ({
    ...emptyTest,
    ...test,
    group: typeof test.group === 'string' ? test.group : '',
    order: test.order ?? index,
    totalQuestions: Array.isArray(test.questions)
      ? test.questions.length
      : (test.totalQuestions || 0),
    questions: Array.isArray(test.questions) ? test.questions : [],
  })),
  isPublished: series?.isPublished !== false,
  isPaid: series?.isPaid === true,
})

export default function TestSeries() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearchTerm(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError } = useGetAllTestSeriesQuery({ page, limit: 20, search: searchTerm, mode: 'summary' })
  const [fetchTestsMeta] = useLazyGetTestsMetaQuery()
  const [fetchSeriesById] = useLazyGetTestSeriesByIdQuery()
  const [createTestSeries, { isLoading: isCreateLoading }] = useCreateTestSeriesMutation()
  const [updateTestSeries, { isLoading: isUpdateLoading }] = useUpdateTestSeriesMutation()
  const [updateTestSeriesTestMeta, { isLoading: isTestMetaUpdating }] = useUpdateTestSeriesTestMetaMutation()
  const [bulkCreateTestSeries, { isLoading: isBulkLoading }] = useBulkCreateTestSeriesMutation()
  const [deleteTestSeries, { isLoading: isDeleteLoading }] = useDeleteTestSeriesMutation()
  const [generateMockTest, { isLoading: isMockGenerating }] = useGenerateMockTestMutation()
  const [generatePracticeSet, { isLoading: isPracticeGenerating }] = useGeneratePracticeSetMutation()

  const [showForm, setShowForm] = useState(false)
  const [showBulkPanel, setShowBulkPanel] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [hydratingDetails, setHydratingDetails] = useState(false)
  const hydrateRequestRef = useRef(0)

  const [form, setForm] = useState(emptySeries)
  const [testInput, setTestInput] = useState(emptyTest)
  const [questionInput, setQuestionInput] = useState(emptyQuestion)
  const [editingTestIndex, setEditingTestIndex] = useState(null)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null)

  const [bulkText, setBulkText] = useState('')
  const [testBulkText, setTestBulkText] = useState('')
  const [bulkError, setBulkError] = useState('')
  const [bulkSuccess, setBulkSuccess] = useState('')

  const [validation, setValidation] = useState({})
  const [originalSeries, setOriginalSeries] = useState(null)
  const [isTestsModified, setIsTestsModified] = useState(false)

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const toastTimerRef = useRef(null)

  const [generateModal, setGenerateModal] = useState(null)
  const [genError, setGenError] = useState('')
  const [genResult, setGenResult] = useState(null)
  const [genForm, setGenForm] = useState({
    title: '',
    description: '',
    duration: 60,
    category: '',
    subject: '',
    topic: '',
    level: 'medium',
    language: 'English',
    maxQuestions: '',
    shuffle: true,
    selectedTestIds: [],
    tags: '',
  })

  const seriesList = data?.data || []
  const totalPages = data?.pages || 1
  const isSaving = isCreateLoading || isUpdateLoading

  const sortedSeries = useMemo(() => (
    [...seriesList].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  ), [seriesList])

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ visible: true, message, type })
    toastTimerRef.current = window.setTimeout(() => {
      setToast((old) => ({ ...old, visible: false }))
    }, 3200)
  }

  const resetEditor = () => {
    setForm(emptySeries)
    setValidation({})
    setTestInput(emptyTest)
    setQuestionInput(emptyQuestion)
    setEditingTestIndex(null)
    setEditingQuestionIndex(null)
    setEditingId(null)
    setOriginalSeries(null)
    setIsTestsModified(false)
    setHydratingDetails(false)
    setShowForm(false)
  }

  const normalizeQuestion = (q) => ({
    ...q,
    question: (q.question || '').trim(),
    options: (q.options || []).map((o) => (o || '').trim()),
    correctAnswer: (q.correctAnswer || '').trim(),
    explanation: (q.explanation || '').trim(),
    questionHi: (q.questionHi || '').trim(),
    optionsHi: (q.optionsHi || []).map((o) => (o || '').trim()),
    correctAnswerHi: (q.correctAnswerHi || '').trim(),
    explanationHi: (q.explanationHi || '').trim(),
  })

  const normalizeTest = (test, index) => ({
    ...test,
    group: (test.group || '').trim(),
    title: (test.title || '').trim(),
    description: (test.description || '').trim(),
    duration: Number(test.duration) || 0,
    order: test.order ?? index,
    questions: (test.questions || []).map(normalizeQuestion),
    totalQuestions: Array.isArray(test.questions) ? test.questions.length : 0,
  })

  const normalizeForm = (draft) => {
    const payload = {
      ...draft,
      title: (draft.title || '').trim(),
      description: (draft.description || '').trim(),
      bookName: (draft.bookName || '').trim(),
      author: (draft.author || '').trim(),
      publisher: (draft.publisher || '').trim(),
      subject: (draft.subject || '').trim(),
      category: (draft.category || '').trim(),
      coverImage: (draft.coverImage || '').trim(),
      language: (draft.language || '').trim() || 'English',
      isPaid: !!draft.isPaid,
      isPublished: draft.isPublished !== false,
      price: Number(draft.price) || 0,
      discountedPrice: Number(draft.discountedPrice) || 0,
      freeTestsCount: Math.max(0, Number(draft.freeTestsCount) || 0),
      tags: typeof draft.tags === 'string'
        ? draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : (Array.isArray(draft.tags) ? draft.tags : []),
      tests: (draft.tests || []).map((test, index) => normalizeTest(test, index)),
    }

    if (!payload.isPaid) {
      payload.price = 0
      payload.discountedPrice = 0
    }

    if (payload.discountedPrice > payload.price) {
      payload.discountedPrice = payload.price
    }

    payload.totalTests = payload.tests.length
    return payload
  }

  const validateSeries = (payload) => {
    const nextValidation = {}

    if (!payload.title) nextValidation.title = 'Series title is required'
    if (!payload.bookName) nextValidation.bookName = 'Book name is required'
    if (!payload.subject) nextValidation.subject = 'Subject is required'
    if (!payload.category) nextValidation.category = 'Category is required'

    if (payload.isPaid && payload.price <= 0) {
      nextValidation.price = 'Price must be greater than 0 for paid series'
    }

    if (payload.discountedPrice < 0) {
      nextValidation.discountedPrice = 'Discounted price cannot be negative'
    }

    if (payload.tests.length === 0) {
      nextValidation.tests = 'Add at least one test before saving'
    }

    setValidation(nextValidation)
    return Object.keys(nextValidation).length === 0
  }

  const validateQuestionDraft = () => {
    const q = normalizeQuestion(questionInput)
    if (!q.question) return 'Question text is required'

    const filledOptions = q.options.filter(Boolean)
    if (filledOptions.length < 2) return 'At least 2 options are required'

    if (!q.correctAnswer) return 'Correct answer is required'
    if (!q.options.includes(q.correctAnswer)) return 'Correct answer must match one option exactly'

    return ''
  }

  const validateTestDraft = (payload) => {
    if (!payload.title) return 'Test title is required'
    if (!payload.duration || Number(payload.duration) <= 0) return 'Duration must be greater than 0'
    if (!Array.isArray(payload.questions) || payload.questions.length === 0) return 'Add at least one question'
    return ''
  }

  const buildUpdatePayload = (normalized) => {
    if (!editingId || !originalSeries) return normalized

    const payload = {}
    const fields = [
      'title', 'description', 'bookName', 'author', 'publisher',
      'subject', 'category', 'coverImage', 'language', 'isPaid',
      'price', 'discountedPrice', 'freeTestsCount', 'isPublished', 'tags',
    ]

    for (const field of fields) {
      const current = normalized[field]
      const original = field === 'tags'
        ? (Array.isArray(originalSeries.tags) ? originalSeries.tags : [])
        : originalSeries[field]

      if (Array.isArray(current) && Array.isArray(original)) {
        if (JSON.stringify(current) !== JSON.stringify(original)) payload[field] = current
      } else if (current !== original) {
        payload[field] = current
      }
    }

    if (isTestsModified) {
      payload.tests = normalized.tests
      payload.totalTests = normalized.tests.length
    }

    return payload
  }

  const handleQuestionSave = () => {
    const err = validateQuestionDraft()
    if (err) return showToast(err, 'error')

    const nextQuestion = normalizeQuestion(questionInput)

    if (editingQuestionIndex == null) {
      const questions = [...testInput.questions, nextQuestion]
      setTestInput((old) => ({ ...old, questions, totalQuestions: questions.length }))
      setQuestionInput(emptyQuestion)
      showToast('Question added', 'success')
      return
    }

    const questions = [...testInput.questions]
    questions[editingQuestionIndex] = nextQuestion
    setTestInput((old) => ({ ...old, questions, totalQuestions: questions.length }))
    setQuestionInput(emptyQuestion)
    setEditingQuestionIndex(null)
    showToast('Question updated', 'success')
  }

  const handleQuestionEdit = (index) => {
    const question = testInput.questions[index]
    if (!question) return
    setQuestionInput({ ...emptyQuestion, ...question })
    setEditingQuestionIndex(index)
  }

  const handleQuestionRemove = (index) => {
    const questions = testInput.questions.filter((_, i) => i !== index)
    setTestInput((old) => ({ ...old, questions, totalQuestions: questions.length }))
    if (editingQuestionIndex === index) {
      setQuestionInput(emptyQuestion)
      setEditingQuestionIndex(null)
    }
  }

  const handleTestSave = async () => {
    let payload = normalizeTest(testInput, editingTestIndex ?? form.tests.length)

    if (editingTestIndex != null) {
      const existingTest = form.tests[editingTestIndex]
      const hasIncomingQuestions = Array.isArray(payload.questions) && payload.questions.length > 0
      const existingQuestionCount = existingTest?.totalQuestions || existingTest?.questions?.length || 0

      const canUseFastMetaUpdate =
        !!editingId
        && !!existingTest?._id
        && !hasIncomingQuestions
        && existingQuestionCount > 0

      if (canUseFastMetaUpdate) {
        if (!payload.title) return showToast('Test title is required', 'error')
        if (!payload.duration || Number(payload.duration) <= 0) return showToast('Duration must be greater than 0', 'error')

        try {
          const result = await updateTestSeriesTestMeta({
            seriesId: editingId,
            testId: String(existingTest._id),
            group: payload.group,
            title: payload.title,
            description: payload.description,
            duration: payload.duration,
            isFree: payload.isFree,
            isPublished: payload.isPublished,
            order: payload.order,
          }).unwrap()

          const merged = {
            ...existingTest,
            ...payload,
            questions: existingTest.questions || [],
            totalQuestions: existingQuestionCount,
            ...(result?.data || {}),
          }

          const tests = form.tests.map((item, idx) => (idx === editingTestIndex ? merged : item))
          setForm((old) => ({ ...old, tests, totalTests: tests.length }))
          setIsTestsModified(true)
          setTestInput(emptyTest)
          setQuestionInput(emptyQuestion)
          setEditingTestIndex(null)
          setEditingQuestionIndex(null)
          showToast('Test meta updated instantly', 'success')
          return
        } catch (error) {
          showToast(`Fast update failed: ${getErrorMessage(error)}`, 'error')
          return
        }
      }

      if (!hasIncomingQuestions && existingQuestionCount > 0) {
        if (Array.isArray(existingTest?.questions) && existingTest.questions.length > 0) {
          payload = {
            ...payload,
            questions: existingTest.questions,
            totalQuestions: existingTest.questions.length,
          }
        } else {
          showToast('Questions are not loaded yet. Please reopen this series once and retry.', 'error')
          return
        }
      }
    }

    const err = validateTestDraft(payload)
    if (err) return showToast(err, 'error')

    let tests
    if (editingTestIndex == null) {
      tests = [...form.tests, payload]
      showToast('Test added', 'success')
    } else {
      tests = form.tests.map((item, idx) => (idx === editingTestIndex ? payload : item))
      showToast('Test updated', 'success')
    }

    setForm((old) => ({ ...old, tests, totalTests: tests.length }))
    setIsTestsModified(true)
    setTestInput(emptyTest)
    setQuestionInput(emptyQuestion)
    setEditingTestIndex(null)
    setEditingQuestionIndex(null)
  }

  const handleTestEdit = (index) => {
    const test = form.tests[index]
    if (!test) return

    setTestInput({ ...emptyTest, ...test, questions: test.questions || [] })
    setQuestionInput(emptyQuestion)
    setEditingTestIndex(index)
    setEditingQuestionIndex(null)
  }

  const handleTestRemove = (index) => {
    const tests = form.tests.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i }))
    setForm((old) => ({ ...old, tests, totalTests: tests.length }))
    setIsTestsModified(true)

    if (editingTestIndex === index) {
      setTestInput(emptyTest)
      setQuestionInput(emptyQuestion)
      setEditingTestIndex(null)
      setEditingQuestionIndex(null)
    }
  }

  const hydrateFullSeries = async (id) => {
    const requestId = Date.now()
    hydrateRequestRef.current = requestId
    setHydratingDetails(true)

    try {
      const result = await fetchSeriesById(id, true).unwrap()
      if (hydrateRequestRef.current !== requestId) return

      const fullSeries = result?.data
      if (!fullSeries) return

      setForm(mapSeriesToForm(fullSeries))
      setOriginalSeries(fullSeries)
      setIsTestsModified(false)
    } catch (error) {
      if (hydrateRequestRef.current !== requestId) return
      showToast(`Loaded quick edit mode. Full data fetch failed: ${getErrorMessage(error)}`, 'error')
    } finally {
      if (hydrateRequestRef.current === requestId) {
        setHydratingDetails(false)
      }
    }
  }

  const handleEdit = async (series) => {
    setShowForm(true)
    setShowBulkPanel(false)
    setValidation({})
    setEditingId(series._id)
    setForm(mapSeriesToForm(series))
    setOriginalSeries(series)
    setIsTestsModified(false)
    setTestInput(emptyTest)
    setQuestionInput(emptyQuestion)
    setEditingTestIndex(null)
    setEditingQuestionIndex(null)

    // Open editor instantly and hydrate full payload in background to remove lag on pen click.
    await hydrateFullSeries(series._id)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test series permanently?')) return

    try {
      await deleteTestSeries(id).unwrap()
      showToast('Test series deleted', 'success')
    } catch (error) {
      showToast(`Delete failed: ${getErrorMessage(error)}`, 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalized = normalizeForm(form)
    if (!validateSeries(normalized)) {
      showToast('Please fix highlighted validations', 'error')
      return
    }

    const payload = editingId ? buildUpdatePayload(normalized) : normalized

    try {
      if (editingId) {
        await updateTestSeries({ id: editingId, ...payload }).unwrap()
        showToast('Test series updated successfully', 'success')
      } else {
        await createTestSeries(payload).unwrap()
        showToast('Test series created successfully', 'success')
      }

      resetEditor()
    } catch (error) {
      showToast(`Save failed: ${getErrorMessage(error)}`, 'error')
    }
  }

  const handleBulkImport = async () => {
    setBulkError('')
    setBulkSuccess('')

    if (!bulkText.trim()) {
      setBulkError('Please paste JSON array first')
      return
    }

    try {
      const items = parseBulkJson(bulkText)
      const result = await bulkCreateTestSeries(items).unwrap()
      const totalInserted = result?.totalInserted ?? items.length
      setBulkSuccess(`Imported ${totalInserted} series successfully`)
      setBulkText('')
    } catch (error) {
      setBulkError(getErrorMessage(error))
    }
  }

  const handleInlineTestBulkImport = () => {
    if (!testBulkText.trim()) return showToast('Paste tests JSON first', 'error')

    try {
      const items = parseBulkJson(testBulkText)
      if (!Array.isArray(items)) throw new Error('Expected array of tests')

      const normalized = items.map((test, index) => normalizeTest(test, form.tests.length + index))
      const tests = [...form.tests, ...normalized]
      setForm((old) => ({ ...old, tests, totalTests: tests.length }))
      setTestBulkText('')
      setIsTestsModified(true)
      showToast(`Imported ${normalized.length} tests to draft`, 'success')
    } catch (error) {
      showToast(`Bulk test import failed: ${getErrorMessage(error)}`, 'error')
    }
  }

  const openGenerateModal = async (series, type) => {
    setGenError('')
    setGenResult(null)
    setGenerateModal({
      seriesId: series._id,
      seriesTitle: series.title,
      type,
      tests: [],
      loadingTests: true,
    })

    setGenForm({
      title: `${series.title} - ${type === 'mock' ? 'Mock Test' : 'Practice Set'}`,
      description: `Generated from ${series.bookName || series.title}`,
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

    try {
      const result = await fetchTestsMeta(series._id, true).unwrap()
      setGenerateModal((old) => old ? {
        ...old,
        tests: result?.data?.tests || [],
        loadingTests: false,
      } : old)
    } catch (error) {
      setGenerateModal((old) => old ? { ...old, loadingTests: false } : old)
      setGenError(`Unable to load tests list: ${getErrorMessage(error)}`)
    }
  }

  const closeGenerateModal = () => {
    setGenerateModal(null)
    setGenError('')
    setGenResult(null)
  }

  const toggleTestSelection = (id) => {
    setGenForm((old) => {
      const exists = old.selectedTestIds.includes(id)
      return {
        ...old,
        selectedTestIds: exists
          ? old.selectedTestIds.filter((item) => item !== id)
          : [...old.selectedTestIds, id],
      }
    })
  }

  const handleGenerate = async () => {
    if (!generateModal) return

    if (!genForm.title.trim()) {
      setGenError('Title is required')
      return
    }

    if (generateModal.type === 'mock' && (!genForm.duration || Number(genForm.duration) <= 0)) {
      setGenError('Valid duration is required')
      return
    }

    setGenError('')

    const basePayload = {
      seriesId: generateModal.seriesId,
      title: genForm.title.trim(),
      description: genForm.description.trim(),
      shuffle: !!genForm.shuffle,
      ...(genForm.maxQuestions ? { maxQuestions: Number(genForm.maxQuestions) } : {}),
      ...(genForm.selectedTestIds.length ? { testIds: genForm.selectedTestIds } : {}),
    }

    try {
      const response = generateModal.type === 'mock'
        ? await generateMockTest({
          ...basePayload,
          category: genForm.category,
          duration: Number(genForm.duration),
        }).unwrap()
        : await generatePracticeSet({
          ...basePayload,
          subject: genForm.subject,
          topic: genForm.topic,
          level: genForm.level,
          language: genForm.language,
          tags: genForm.tags.split(',').map((item) => item.trim()).filter(Boolean),
        }).unwrap()

      setGenResult(response)
      showToast(response?.message || 'Generated successfully', 'success')
    } catch (error) {
      setGenError(getErrorMessage(error))
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Copied to clipboard', 'success')
    } catch {
      showToast('Clipboard access failed', 'error')
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message="Failed to load test series" />

  return (
    <div className="page-container">
      <div className="page-header stack-mobile">
        <div>
          <h1 className="page-title">Test Series</h1>
          <p className="page-subtitle">Cleaner workflow with fast edit mode and strict validations</p>
        </div>
        <div className="compact-actions">
          <input
            placeholder="Search series..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <button className="btn btn-secondary" onClick={() => setShowBulkPanel((v) => !v)}>
            <i className="fa-solid fa-file-import"></i> {showBulkPanel ? 'Hide Bulk' : 'Bulk Import'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm((v) => !v)
              if (!showForm) {
                setEditingId(null)
                setForm(emptySeries)
                setValidation({})
              }
            }}
          >
            <i className="fa-solid fa-plus"></i> {showForm ? 'Close Editor' : 'Add Series'}
          </button>
        </div>
      </div>

      {toast.visible && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}

      {showBulkPanel && (
        <div className="form-card">
          <h3>Bulk Import</h3>
          <p className="page-subtitle">Use valid JSON array for fast import.</p>
          <div className="compact-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setBulkText(bulkExample)}>Use Example</button>
            <button type="button" className="btn btn-secondary" onClick={() => copyToClipboard(bulkExample)}>Copy Example</button>
          </div>
          <div className="form-group full">
            <label>JSON Array</label>
            <textarea rows={12} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
          </div>
          <div className="compact-actions">
            <button type="button" className="btn btn-primary" onClick={handleBulkImport} disabled={isBulkLoading}>
              {isBulkLoading ? 'Importing...' : 'Import'}
            </button>
          </div>
          {bulkError && <div className="error-text">{bulkError}</div>}
          {bulkSuccess && <div className="success-text">{bulkSuccess}</div>}
        </div>
      )}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="split">
            <h3>{editingId ? 'Edit Test Series' : 'Create Test Series'}</h3>
            <div className="compact-actions">
              {hydratingDetails && <span className="text-muted">Loading full details...</span>}
              <button type="button" className="btn btn-secondary" onClick={resetEditor}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Series Title</label>
              <input
                className={validation.title ? 'input-error' : ''}
                value={form.title}
                onChange={(e) => setForm((old) => ({ ...old, title: e.target.value }))}
              />
              {validation.title && <small className="error-text">{validation.title}</small>}
            </div>
            <div className="form-group">
              <label>Book Name</label>
              <input
                className={validation.bookName ? 'input-error' : ''}
                value={form.bookName}
                onChange={(e) => setForm((old) => ({ ...old, bookName: e.target.value }))}
              />
              {validation.bookName && <small className="error-text">{validation.bookName}</small>}
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                className={validation.subject ? 'input-error' : ''}
                value={form.subject}
                onChange={(e) => setForm((old) => ({ ...old, subject: e.target.value }))}
              />
              {validation.subject && <small className="error-text">{validation.subject}</small>}
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                className={validation.category ? 'input-error' : ''}
                value={form.category}
                onChange={(e) => setForm((old) => ({ ...old, category: e.target.value }))}
              />
              {validation.category && <small className="error-text">{validation.category}</small>}
            </div>
            <div className="form-group">
              <label>Language</label>
              <input value={form.language} onChange={(e) => setForm((old) => ({ ...old, language: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Cover URL</label>
              <input value={form.coverImage} onChange={(e) => setForm((old) => ({ ...old, coverImage: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Series Type</label>
              <select value={form.isPaid} onChange={(e) => setForm((old) => ({ ...old, isPaid: e.target.value === 'true' }))}>
                <option value="false">Free</option>
                <option value="true">Paid</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.isPublished} onChange={(e) => setForm((old) => ({ ...old, isPublished: e.target.value === 'true' }))}>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price</label>
              <input
                className={validation.price ? 'input-error' : ''}
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((old) => ({ ...old, price: Number(e.target.value) }))}
                disabled={!form.isPaid}
              />
              {validation.price && <small className="error-text">{validation.price}</small>}
            </div>
            <div className="form-group">
              <label>Discounted Price</label>
              <input
                className={validation.discountedPrice ? 'input-error' : ''}
                type="number"
                min="0"
                value={form.discountedPrice}
                onChange={(e) => setForm((old) => ({ ...old, discountedPrice: Number(e.target.value) }))}
                disabled={!form.isPaid}
              />
              {validation.discountedPrice && <small className="error-text">{validation.discountedPrice}</small>}
            </div>
            <div className="form-group">
              <label>Free Tests Count</label>
              <input type="number" min="0" value={form.freeTestsCount} onChange={(e) => setForm((old) => ({ ...old, freeTestsCount: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label>Tags</label>
              <input value={form.tags} onChange={(e) => setForm((old) => ({ ...old, tags: e.target.value }))} placeholder="ssc, gk, chapterwise" />
            </div>
            <div className="form-group full">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm((old) => ({ ...old, description: e.target.value }))} />
            </div>
          </div>

          <div className="question-builder">
            <div className="split">
              <h4>Draft Tests ({form.tests.length})</h4>
              <div className="compact-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setTestBulkText(testBulkExample)}>Use Test Example</button>
                <button type="button" className="btn btn-secondary" onClick={() => copyToClipboard(testBulkExample)}>Copy Test Example</button>
              </div>
            </div>

            <div className="form-group full">
              <label>Bulk Tests JSON (optional)</label>
              <textarea rows={6} value={testBulkText} onChange={(e) => setTestBulkText(e.target.value)} />
              <div className="compact-actions">
                <button type="button" className="btn btn-secondary" onClick={handleInlineTestBulkImport}>Import Tests To Draft</button>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Test Group</label>
                <input value={testInput.group} onChange={(e) => setTestInput((old) => ({ ...old, group: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Test Title</label>
                <input value={testInput.title} onChange={(e) => setTestInput((old) => ({ ...old, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input type="number" min="1" value={testInput.duration} onChange={(e) => setTestInput((old) => ({ ...old, duration: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Test Access</label>
                <select value={testInput.isFree} onChange={(e) => setTestInput((old) => ({ ...old, isFree: e.target.value === 'true' }))}>
                  <option value="false">Paid/Locked</option>
                  <option value="true">Free</option>
                </select>
              </div>
            </div>

            <div className="form-group full">
              <label>Test Description</label>
              <textarea rows={2} value={testInput.description} onChange={(e) => setTestInput((old) => ({ ...old, description: e.target.value }))} />
            </div>

            <div className="form-group full">
              <label>Question</label>
              <input value={questionInput.question} onChange={(e) => setQuestionInput((old) => ({ ...old, question: e.target.value }))} />
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
                      setQuestionInput((old) => ({ ...old, options }))
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Correct Answer</label>
                <input value={questionInput.correctAnswer} onChange={(e) => setQuestionInput((old) => ({ ...old, correctAnswer: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Explanation</label>
                <input value={questionInput.explanation} onChange={(e) => setQuestionInput((old) => ({ ...old, explanation: e.target.value }))} />
              </div>
            </div>

            <div className="compact-actions">
              <button type="button" className="btn btn-secondary" onClick={handleQuestionSave}>
                {editingQuestionIndex == null ? 'Add Question' : 'Update Question'}
              </button>
              {editingQuestionIndex != null && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setQuestionInput(emptyQuestion)
                    setEditingQuestionIndex(null)
                  }}
                >
                  Cancel Question Edit
                </button>
              )}
            </div>

            {testInput.questions.length > 0 && (
              <div className="chip-row">
                {testInput.questions.map((question, index) => (
                  <div className="question-chip" key={index}>
                    <span>Q{index + 1}: {(question.question || '').slice(0, 42)}...</span>
                    <div className="table-actions">
                      <button type="button" onClick={() => handleQuestionEdit(index)} title="Edit question">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button type="button" onClick={() => handleQuestionRemove(index)} title="Remove question">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="compact-actions mt-4">
              <button type="button" className="btn btn-primary" onClick={handleTestSave}>
                {(isTestMetaUpdating || hydratingDetails)
                  ? 'Updating...'
                  : (editingTestIndex == null ? 'Add Test To Draft' : 'Update Test In Draft')}
              </button>
              {editingTestIndex != null && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setEditingTestIndex(null)
                    setTestInput(emptyTest)
                    setQuestionInput(emptyQuestion)
                    setEditingQuestionIndex(null)
                  }}
                >
                  Cancel Test Edit
                </button>
              )}
            </div>

            {validation.tests && <div className="error-text">{validation.tests}</div>}

            {form.tests.length > 0 && (
              <div className="chip-row">
                {form.tests.map((test, index) => (
                  <div className="question-chip" key={`${test.title}-${index}`}>
                    <span>
                      {index + 1}. {test.group ? `${test.group} - ` : ''}{test.title} ({test.totalQuestions || test.questions?.length || 0} Q, {test.duration}m)
                    </span>
                    <div className="table-actions">
                      <button type="button" onClick={() => handleTestEdit(index)} title="Edit test">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button type="button" onClick={() => handleTestRemove(index)} title="Remove test">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              {sortedSeries.map((series) => (
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
                      <button className="btn-icon btn-generate-mock" onClick={() => openGenerateModal(series, 'mock')} title="Generate Mock Test">M</button>
                      <button className="btn-icon btn-generate-practice" onClick={() => openGenerateModal(series, 'practice')} title="Generate Practice Set">P</button>
                      <button className="btn-icon btn-edit" onClick={() => handleEdit(series)} title="Edit">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(series._id)} title="Delete" disabled={isDeleteLoading}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedSeries.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-text">No test series found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="compact-actions" style={{ justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
          <span className="text-muted">Page {page} of {totalPages}</span>
          <div className="compact-actions">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>

      {generateModal && (
        <div className="modal-overlay" onClick={closeGenerateModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {generateModal.type === 'mock' ? 'Generate Mock Test' : 'Generate Practice Set'}
                </h3>
                <p className="modal-subtitle">Source: {generateModal.seriesTitle}</p>
              </div>
              <button className="modal-close" onClick={closeGenerateModal}>X</button>
            </div>

            {genResult ? (
              <div className="gen-success">
                <div className="gen-success-icon">OK</div>
                <h4>{genResult.message || 'Created successfully'}</h4>
                <p><strong>Title:</strong> {genResult.data?.title}</p>
                <p><strong>Questions:</strong> {genResult.data?.totalQuestions}</p>
                {generateModal.type === 'mock' && <p><strong>Duration:</strong> {genResult.data?.duration} min</p>}
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeGenerateModal}>Close</button>
                </div>
              </div>
            ) : (
              <>
                <div className="gen-section">
                  <label className="gen-label">Select Tests (empty means all)</label>
                  <div className="gen-test-list">
                    {generateModal.loadingTests && <span className="text-muted">Loading tests...</span>}
                    {(generateModal.tests || []).map((test) => {
                      const id = String(test._id)
                      const checked = genForm.selectedTestIds.includes(id)
                      return (
                        <label key={id} className="gen-test-item">
                          <input type="checkbox" checked={checked} onChange={() => toggleTestSelection(id)} />
                          <span className="gen-test-name">{test.title}</span>
                          <span className="gen-test-count">{test.totalQuestions || 0} Q</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="gen-section">
                  <div className="form-grid">
                    <div className="form-group full">
                      <label>Title</label>
                      <input value={genForm.title} onChange={(e) => setGenForm((old) => ({ ...old, title: e.target.value }))} />
                    </div>
                    <div className="form-group full">
                      <label>Description</label>
                      <input value={genForm.description} onChange={(e) => setGenForm((old) => ({ ...old, description: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Max Questions</label>
                      <input type="number" min="1" value={genForm.maxQuestions} onChange={(e) => setGenForm((old) => ({ ...old, maxQuestions: e.target.value }))} />
                    </div>

                    {generateModal.type === 'mock' ? (
                      <>
                        <div className="form-group">
                          <label>Duration</label>
                          <input type="number" min="1" value={genForm.duration} onChange={(e) => setGenForm((old) => ({ ...old, duration: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label>Category</label>
                          <input value={genForm.category} onChange={(e) => setGenForm((old) => ({ ...old, category: e.target.value }))} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label>Subject</label>
                          <input value={genForm.subject} onChange={(e) => setGenForm((old) => ({ ...old, subject: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label>Topic</label>
                          <input value={genForm.topic} onChange={(e) => setGenForm((old) => ({ ...old, topic: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label>Level</label>
                          <select value={genForm.level} onChange={(e) => setGenForm((old) => ({ ...old, level: e.target.value }))}>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Language</label>
                          <input value={genForm.language} onChange={(e) => setGenForm((old) => ({ ...old, language: e.target.value }))} />
                        </div>
                        <div className="form-group full">
                          <label>Tags (comma separated)</label>
                          <input value={genForm.tags} onChange={(e) => setGenForm((old) => ({ ...old, tags: e.target.value }))} />
                        </div>
                      </>
                    )}
                  </div>

                  <label className="gen-shuffle-row">
                    <input type="checkbox" checked={genForm.shuffle} onChange={(e) => setGenForm((old) => ({ ...old, shuffle: e.target.checked }))} />
                    <span>Shuffle questions</span>
                  </label>
                </div>

                {genError && <div className="error-text">{genError}</div>}

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeGenerateModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleGenerate} disabled={isMockGenerating || isPracticeGenerating}>
                    {(isMockGenerating || isPracticeGenerating) ? 'Generating...' : 'Generate'}
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
