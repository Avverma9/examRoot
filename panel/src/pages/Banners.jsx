import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  useGetAllBannersAdminQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useReorderBannersMutation,
} from '../services/bannerApi'
import { uploadToR2 } from '../utils/uploadToR2'

const emptyBanner = {
  title: '',
  subtitle: '',
  imageUrl: '',
  color: '#FF6B6B',
  order: 0,
  isActive: true,
  link: '',
}

export default function Banners() {
  const { data, isLoading, isError, refetch } = useGetAllBannersAdminQuery()
  const [createBanner] = useCreateBannerMutation()
  const [updateBanner] = useUpdateBannerMutation()
  const [deleteBanner] = useDeleteBannerMutation()
  const [reorderBanners] = useReorderBannersMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyBanner)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState('')

  const bannerList = data?.data || []

  const resetForm = () => {
    setForm(emptyBanner)
    setEditingId(null)
    setShowForm(false)
    setImageError('')
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageLoading(true)
    setImageError('')

    try {
      const publicUrl = await uploadToR2({
        file,
        type: 'banner',
      })
      setForm({ ...form, imageUrl: publicUrl })
    } catch (err) {
      setImageError(err.message || 'Failed to upload image')
    } finally {
      setImageLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateBanner({ id: editingId, ...form }).unwrap()
      } else {
        await createBanner(form).unwrap()
      }
      resetForm()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  const handleEdit = (banner) => {
    setForm(banner)
    setEditingId(banner._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return
    try {
      await deleteBanner(id).unwrap()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  const handleReorder = async (banners) => {
    try {
      await reorderBanners({
        banners: banners.map((b, idx) => ({ id: b._id, order: idx })),
      }).unwrap()
      refetch()
    } catch (err) {
      alert('Error: ' + (err.data?.message || err.message))
    }
  }

  const moveUp = (index) => {
    if (index === 0) return
    const newList = [...bannerList]
    ;[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]
    handleReorder(newList)
  }

  const moveDown = (index) => {
    if (index === bannerList.length - 1) return
    const newList = [...bannerList]
    ;[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    handleReorder(newList)
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message="Failed to load banners" />

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Home Page Banners</h1>
          <p className="page-subtitle">Manage the 3 rotating banners on mobile home page</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fa-solid fa-plus"></i> {showForm ? 'Cancel' : 'Add Banner'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Banner' : 'Create New Banner'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Color (Hex)</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Optional Link</label>
              <input
                placeholder="https://..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group full">
            <label>Banner Image (Upload to R2)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={imageLoading}
                style={{ flex: 1 }}
              />
              {form.imageUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  disabled={imageLoading}
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Remove
                </button>
              )}
            </div>
            {imageLoading && <p style={{ color: '#8B5CF6', marginTop: '8px' }}>Uploading...</p>}
            {imageError && <p style={{ color: '#EF4444', marginTop: '8px' }}>Error: {imageError}</p>}
            {form.imageUrl && (
              <div style={{ marginTop: '12px' }}>
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>✅ Uploaded to R2</p>
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
        <h3>Banners (in display order)</h3>
        {bannerList.length === 0 ? (
          <p className="empty-text">No banners yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bannerList.map((banner, index) => (
              <div
                key={banner._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                {/* Preview */}
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  style={{
                    width: '80px',
                    height: '60px',
                    borderRadius: '6px',
                    objectFit: 'cover',
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{banner.title}</p>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                    {banner.subtitle}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '16px', backgroundColor: banner.color, borderRadius: '3px', marginRight: '4px', verticalAlign: 'middle' }}></span>
                    {banner.isActive ? '🟢 Active' : '⚪ Inactive'}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      className="btn-icon"
                      title="Move up"
                    >
                      <i className="fa-solid fa-arrow-up"></i>
                    </button>
                  )}
                  {index < bannerList.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      className="btn-icon"
                      title="Move down"
                    >
                      <i className="fa-solid fa-arrow-down"></i>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEdit(banner)}
                    className="btn-icon btn-edit"
                    title="Edit"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(banner._id)}
                    className="btn-icon btn-delete"
                    title="Delete"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
