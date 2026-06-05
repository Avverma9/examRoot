import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  useGetAllTestSeriesQuery,
  useCreateTestSeriesMutation,
  useBulkCreateTestSeriesMutation,
  useUpdateTestSeriesMutation,
  useDeleteTestSeriesMutation,
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

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptySeries)
  const [testInput, setTestInput] = useState(emptyTest)
  const [questionInput, setQuestionInput] = useState(emptyQuestion)
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkError, setBulkError] = useState('')
  const [bulkInfo, setBulkInfo] = useState('')

  const seriesList = data?.data || []

  const bulkExample = `[
  {
    "title": "SSC Maths Book Test Series",
    "description": "Chapter wise tests from the practice book",
    "bookName": "SSC Mathematics Practice Book",
    "author": "ExamRoot Faculty",
    "publisher": "ExamRoot",
    "subject": "Mathematics",
    "category": "SSC",
    "language": "Hindi + English",
    "isPaid": true,
    "price": 299,
    "discountedPrice": 199,
    "freeTestsCount": 1,
    "tags": ["ssc", "maths", "book"],
    "isPublished": true,
    "tests": [
      {
        "title": "Algebra Test 1",
        "description": "Linear equations",
        "duration": 45,
        "isFree": true,
        "isPublished": true,
        "questions": [
          {
            "question": "Solve: 2x + 3 = 7",
            "options": ["x = 1", "x = 2", "x = 3", "x = 4"],
            "correctAnswer": "x = 2",
            "explanation": "2x = 4, so x = 2"
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
              setBulkInfo('Example loaded')
              setBulkError('')
              setBulkResult(null)
            }}
          >
            See Example
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              try {
                await copyToClipboard(bulkExample)
                setBulkInfo('Example copied')
                alert('Copied!')
              } catch (e) {
                setBulkError(e.message || 'Copy failed')
              }
            }}
          >
            Copy Example
          </button>
        </div>
        <div className="form-group full">
          <label>JSON Array</label>
          <textarea
            rows={10}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder='[{"title":"...","bookName":"...","subject":"...","category":"...","tests":[{"title":"...","duration":60,"questions":[{"question":"...","options":["A","B"],"correctAnswer":"A"}]}]}]'
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
    </div>
  )
}
