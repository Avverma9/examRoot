import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  useGetAllMockTestsQuery,
  useCreateMockTestMutation,
  useBulkCreateMockTestsMutation,
  useUpdateMockTestMutation,
  useDeleteMockTestMutation,
} from '../services/mockTestApi'
import { parseBulkJson } from '../utils/bulkImport'

export default function MockTests() {
  const { data, isLoading, isError, refetch } = useGetAllMockTestsQuery()
  const [createMockTest] = useCreateMockTestMutation()
  const [bulkCreateMockTests, { isLoading: isBulkLoading }] = useBulkCreateMockTestsMutation()
  const [updateMockTest] = useUpdateMockTestMutation()
  const [deleteMockTest] = useDeleteMockTestMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkError, setBulkError] = useState('')
  const [bulkInfo, setBulkInfo] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    duration: 60,
    totalQuestions: 0,
    questions: [],
    isPublished: true,
  })
  const [questionInput, setQuestionInput] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
  })

  const mockTests = data?.data || []

  const bulkExample = `[
  {
    "title": "Math Mock Test - 1",
    "description": "Basic algebra and arithmetic",
    "category": "Mathematics",
    "duration": 60,
    "isPublished": true,
    "questions": [
      {
        "question": "What is 15% of 200?",
        "options": ["20", "30", "40", "50"],
        "correctAnswer": "30",
        "explanation": "15% of 200 = 0.15 × 200 = 30"
      }
    ],
    "totalQuestions": 1
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
      const result = await bulkCreateMockTests(items).unwrap()
      setBulkResult(result)
      setBulkText('')
      refetch()
    } catch (err) {
      setBulkError(err.data?.message || err.message || 'Bulk import failed')
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: '',
      duration: 60,
      totalQuestions: 0,
      questions: [],
      isPublished: true,
    })
    setQuestionInput({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const addQuestion = () => {
    if (!questionInput.question || !questionInput.correctAnswer) return
    const newQuestion = { ...questionInput }
    setForm({
      ...form,
      questions: [...form.questions, newQuestion],
      totalQuestions: form.questions.length + 1,
    })
    setQuestionInput({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
    })
  }

  const removeQuestion = (index) => {
    const updated = form.questions.filter((_, i) => i !== index)
    setForm({ ...form, questions: updated, totalQuestions: updated.length })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateMockTest({ id: editingId, ...form }).unwrap()
      } else {
        await createMockTest(form).unwrap()
      }
      resetForm()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  const handleEdit = (test) => {
    setForm({
      title: test.title,
      description: test.description || '',
      category: test.category,
      duration: test.duration,
      totalQuestions: test.totalQuestions || 0,
      questions: test.questions || [],
      isPublished: test.isPublished !== false,
    })
    setEditingId(test._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this mock test?')) return
    try {
      await deleteMockTest(id).unwrap()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message="Failed to load mock tests" />

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mock Tests</h1>
          <p className="page-subtitle">Manage mock test exams</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fa-solid fa-plus"></i> {showForm ? 'Cancel' : 'Add Test'}
        </button>
      </div>

      <div className="form-card">
        <h3>Bulk Import</h3>
        <p className="page-subtitle">
          Paste JSON array (array of mock tests with `questions`).
        </p>
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
            placeholder='[{"title":"...","category":"...","duration":60,"description":"","isPublished":true,"questions":[{"question":"...","options":["A","B"],"correctAnswer":"A","explanation":""}],"totalQuestions":1}]'
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
          <h3>{editingId ? 'Edit Mock Test' : 'Add New Mock Test'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.value === 'true' })}
              >
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
          </div>
          <div className="form-group full">
            <label>Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="question-builder">
            <h4>Add Questions ({form.questions.length} added)</h4>
            <div className="form-group full">
              <label>Question</label>
              <input
                type="text"
                value={questionInput.question}
                onChange={(e) => setQuestionInput({ ...questionInput, question: e.target.value })}
                placeholder="Enter question text"
              />
            </div>
            <div className="form-grid">
              {questionInput.options.map((opt, i) => (
                <div className="form-group" key={i}>
                  <label>Option {String.fromCharCode(65 + i)}</label>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const opts = [...questionInput.options]
                      opts[i] = e.target.value
                      setQuestionInput({ ...questionInput, options: opts })
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  />
                </div>
              ))}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Correct Answer</label>
                <input
                  type="text"
                  value={questionInput.correctAnswer}
                  onChange={(e) => setQuestionInput({ ...questionInput, correctAnswer: e.target.value })}
                  placeholder="Correct option text"
                />
              </div>
              <div className="form-group">
                <label>Explanation</label>
                <input
                  type="text"
                  value={questionInput.explanation}
                  onChange={(e) => setQuestionInput({ ...questionInput, explanation: e.target.value })}
                  placeholder="Answer explanation"
                />
              </div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={addQuestion}>
              <i className="fa-solid fa-plus"></i> Add Question
            </button>

            {form.questions.length > 0 && (
              <div className="question-list">
                {form.questions.map((q, idx) => (
                  <div key={idx} className="question-chip">
                    <span>Q{idx + 1}: {q.question.slice(0, 40)}...</span>
                    <button type="button" onClick={() => removeQuestion(idx)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockTests.map((test) => (
                <tr key={test._id}>
                  <td>
                    <div className="cell-title">{test.title}</div>
                  </td>
                  <td>{test.category}</td>
                  <td>{test.duration} min</td>
                  <td>{test.totalQuestions || 0}</td>
                  <td>
                    <span className={`status-badge ${test.isPublished !== false ? 'published' : 'draft'}`}>
                      {test.isPublished !== false ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" onClick={() => handleEdit(test)} title="Edit">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(test._id)} title="Delete">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {mockTests.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-text">No mock tests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
