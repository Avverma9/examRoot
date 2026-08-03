import React, { useState } from 'react';
import {
  useGetAllBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from '../store/api';

interface BannerData {
  _id?: string;
  title: string;
  description: string;
  imageUrl: string;
  actionType: 'series' | 'url' | 'none';
  actionValue: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function Banners() {
  const { data: bannersData, isLoading } = useGetAllBannersQuery(undefined);
  const [createBanner] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
  const [formData, setFormData] = useState<BannerData>({
    title: '',
    description: '',
    imageUrl: '',
    actionType: 'none',
    actionValue: '',
    displayOrder: 0,
    isActive: true,
  });

  const banners = bannersData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner?._id) {
        await updateBanner({ id: editingBanner._id, ...formData }).unwrap();
        alert('Banner updated successfully!');
      } else {
        await createBanner(formData).unwrap();
        alert('Banner created successfully!');
      }
      handleCloseModal();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to save banner');
    }
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      actionType: banner.actionType || 'none',
      actionValue: banner.actionValue || '',
      displayOrder: banner.displayOrder || 0,
      isActive: banner.isActive,
      startDate: banner.startDate?.split('T')[0],
      endDate: banner.endDate?.split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await deleteBanner(id).unwrap();
      alert('Banner deleted successfully!');
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to delete banner');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      actionType: 'none',
      actionValue: '',
      displayOrder: 0,
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Home Banners</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          + Create Banner
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No banners found. Create one to get started.
          </div>
        ) : (
          banners.map((banner: any) => (
            <div key={banner._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
              {/* Image Preview */}
              {banner.imageUrl ? (
                <div className="w-full h-40 overflow-hidden bg-gray-100">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}

              {/* Banner Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 flex-1">{banner.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      banner.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {banner.description && (
                  <p className="text-sm text-gray-600 mb-2">{banner.description}</p>
                )}

                <div className="space-y-1 mb-3 text-xs text-gray-500">
                  <p>
                    <strong>Action:</strong> {banner.actionType === 'series' ? '→ Series' : banner.actionType === 'url' ? '→ External URL' : 'None'}
                  </p>
                  <p>
                    <strong>Order:</strong> {banner.displayOrder}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 text-blue-600 hover:text-blue-800 px-3 py-2 rounded hover:bg-blue-50 transition text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="flex-1 text-red-600 hover:text-red-800 px-3 py-2 rounded hover:bg-red-50 transition text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    placeholder="e.g., Featured Series"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    placeholder="https://example.com/banner.jpg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1080×220px</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    rows={2}
                    placeholder="Short description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Action Type
                  </label>
                  <select
                    value={formData.actionType}
                    onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                  >
                    <option value="none">No Action</option>
                    <option value="series">Open Series</option>
                    <option value="url">Open External Link</option>
                  </select>
                </div>

                {formData.actionType === 'series' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Series ID
                    </label>
                    <input
                      type="text"
                      value={formData.actionValue}
                      onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="Paste series ID here"
                    />
                  </div>
                )}

                {formData.actionType === 'url' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.actionValue}
                      onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower number = shown first</p>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm font-semibold text-gray-900">Active</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  {editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
