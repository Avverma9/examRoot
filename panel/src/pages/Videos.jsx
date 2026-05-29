import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  useGetAllVideosQuery,
  useCreateVideoMutation,
  useBulkCreateVideosMutation,
  useUpdateVideoMutation,
  useDeleteVideoMutation,
} from '../services/videoApi'
import { parseBulkJson } from '../utils/bulkImport'

export default function Videos() {
  const { data, isLoading, isError, refetch } = useGetAllVideosQuery()
  const [createVideo] = useCreateVideoMutation()
  const [bulkCreateVideos, { isLoading: isBulkLoading }] = useBulkCreateVideosMutation()
  const [updateVideo] = useUpdateVideoMutation()
  const [deleteVideo] = useDeleteVideoMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkError, setBulkError] = useState('')
  const [bulkInfo, setBulkInfo] = useState('')
  const [form, setForm] = useState({
    videoTitle: '',
    thumbnail: '',
    videoUrl: '',
    duration: '',
    category: '',
    description: '',
    isPublished: true,
  })

  const videos = data?.data || []

  const bulkExample = `[
  {
    "videoTitle": "Algebra Basics - Part 1",
    "thumbnail": "https://example.com/thumbs/algebra-1.jpg",
    "videoUrl": "https://example.com/videos/algebra-1",
    "duration": "10:25",
    "category": "Mathematics",
    "description": "Introduction to algebraic expressions",
    "views": 0,
    "isPublished": true
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
      const result = await bulkCreateVideos(items).unwrap()
      setBulkResult(result)
      setBulkText('')
      refetch()
    } catch (err) {
      setBulkError(err.data?.message || err.message || 'Bulk import failed')
    }
  }

  const resetForm = () => {
    setForm({
      videoTitle: '',
      thumbnail: '',
      videoUrl: '',
      duration: '',
      category: '',
      description: '',
      isPublished: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateVideo({ id: editingId, ...form }).unwrap()
      } else {
        await createVideo(form).unwrap()
      }
      resetForm()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  const handleEdit = (video) => {
    setForm({
      videoTitle: video.videoTitle,
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      duration: video.duration,
      category: video.category,
      description: video.description || '',
      isPublished: video.isPublished !== false,
    })
    setEditingId(video._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this video?')) return
    try {
      await deleteVideo(id).unwrap()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message="Failed to load videos" />

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Videos</h1>
          <p className="page-subtitle">Manage all video content</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fa-solid fa-plus"></i> {showForm ? 'Cancel' : 'Add Video'}
        </button>
      </div>

      <div className="form-card">
        <h3>Bulk Import</h3>
        <p className="page-subtitle">
          Paste JSON array (example template available below).
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
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder='[{"videoTitle":"...","thumbnail":"...","videoUrl":"...","duration":"10:25","category":"...","description":"","views":0,"isPublished":true}]'
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
          <h3>{editingId ? 'Edit Video' : 'Add New Video'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Video Title</label>
              <input
                type="text"
                value={form.videoTitle}
                onChange={(e) => setForm({ ...form, videoTitle: e.target.value })}
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
              <label>Thumbnail URL</label>
              <input
                type="url"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Video URL</label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                placeholder="e.g. 10:25"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
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
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
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
                <th>Views</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video._id}>
                  <td>
                    <div className="cell-title">{video.videoTitle}</div>
                  </td>
                  <td>{video.category}</td>
                  <td>{video.duration}</td>
                  <td>{video.views || 0}</td>
                  <td>
                    <span className={`status-badge ${video.isPublished !== false ? 'published' : 'draft'}`}>
                      {video.isPublished !== false ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" onClick={() => handleEdit(video)} title="Edit">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(video._id)} title="Delete">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {videos.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-text">No videos found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
