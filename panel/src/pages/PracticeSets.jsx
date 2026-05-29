import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  useGetAllPracticeSetsQuery,
  useCreatePracticeSetMutation,
  useBulkCreatePracticeSetsMutation,
  useUpdatePracticeSetMutation,
  useDeletePracticeSetMutation,
} from '../services/practiceSetApi'
import { parseBulkJson } from '../utils/bulkImport'

export default function PracticeSets() {
  const { data, isLoading, isError, refetch } = useGetAllPracticeSetsQuery()
  const [createPracticeSet] = useCreatePracticeSetMutation()
  const [bulkCreatePracticeSets, { isLoading: isBulkLoading }] = useBulkCreatePracticeSetsMutation()
  const [updatePracticeSet] = useUpdatePracticeSetMutation()
  const [deletePracticeSet] = useDeletePracticeSetMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkError, setBulkError] = useState('')
  const [bulkInfo, setBulkInfo] = useState('')
  const [form, setForm] = useState({
    title: '',
    subject: '',
    topic: '',
    level: 'easy',
    totalQuestions: 0,
    questions: [],
  })
  const [questionInput, setQuestionInput] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
  })

  const practiceSets = data?.data || []

  const bulkExample = `[
  {
    "title": "Algebra Practice Set 1",
    "subject": "Mathematics",
    "topic": "Algebra",
    "level": "easy",
    "questions": [
      {
        "question": "Solve: 2x + 3 = 7",
        "options": ["x = 1", "x = 2", "x = 3", "x = 4"],
        "correctAnswer": "x = 2"
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
      const result = await bulkCreatePracticeSets(items).unwrap()
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
      subject: '',
      topic: '',
      level: 'easy',
      totalQuestions: 0,
      questions: [],
    })
    setQuestionInput({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
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
        await updatePracticeSet({ id: editingId, ...form }).unwrap()
      } else {
        await createPracticeSet(form).unwrap()
      }
      resetForm()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  const handleEdit = (set) => {
    setForm({
      title: set.title,
      subject: set.subject,
      topic: set.topic,
      level: set.level,
      totalQuestions: set.totalQuestions || 0,
      questions: set.questions || [],
    })
    setEditingId(set._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this practice set?')) return
    try {
      await deletePracticeSet(id).unwrap()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message="Failed to load practice sets" />

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Practice Sets</h1>
          <p className="page-subtitle">Manage practice questions and sets</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fa-solid fa-plus"></i> {showForm ? 'Cancel' : 'Add Set'}
        </button>
      </div>

      <div className="form-card">
        <h3>Bulk Import</h3>
        <p className="page-subtitle">
          Paste JSON array (array of practice sets with `questions`).
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
            placeholder='[{"title":"...","subject":"...","topic":"...","level":"easy","questions":[{"question":"...","options":["A","B"],"correctAnswer":"A"}],"totalQuestions":1}]'
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
          <h3>{editingId ? 'Edit Practice Set' : 'Add New Practice Set'}</h3>
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
              <label>Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Topic</label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
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
            <div className="form-group">
              <label>Correct Answer</label>
              <input
                type="text"
                value={questionInput.correctAnswer}
                onChange={(e) => setQuestionInput({ ...questionInput, correctAnswer: e.target.value })}
                placeholder="Enter correct option text"
              />
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
                <th>Subject</th>
                <th>Topic</th>
                <th>Level</th>
                <th>Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {practiceSets.map((set) => (
                <tr key={set._id}>
                  <td>
                    <div className="cell-title">{set.title}</div>
                  </td>
                  <td>{set.subject}</td>
                  <td>{set.topic}</td>
                  <td>
                    <span className={`level-badge ${set.level}`}>{set.level}</span>
                  </td>
                  <td>{set.totalQuestions || 0}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" onClick={() => handleEdit(set)} title="Edit">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(set._id)} title="Delete">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {practiceSets.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-text">No practice sets found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
