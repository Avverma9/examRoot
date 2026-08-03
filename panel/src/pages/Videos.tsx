import React, { useState } from 'react';
import {
  useGetVideosQuery,
  useCreateVideoMutation,
  useUpdateVideoMutation,
  useDeleteVideoMutation,
} from '../store/api';

interface VideoData {
  _id?: string;
  videoTitle: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  category: string;
  subject: string;
  instructor: string;
  duration: string;
  views: number;
  likes: number;
  isPublished: boolean;
  isPremium: boolean;
  language: string;
  order: number;
  tags: string[];
}

export default function Videos() {
  const { data: videosData, isLoading } = useGetVideosQuery(undefined);
  const [createVideo] = useCreateVideoMutation();
  const [updateVideo] = useUpdateVideoMutation();
  const [deleteVideo] = useDeleteVideoMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [formData, setFormData] = useState<VideoData>({
    videoTitle: '',
    description: '',
    videoUrl: '',
    thumbnail: '',
    category: '',
    subject: '',
    instructor: '',
    duration: '0:00',
    views: 0,
    likes: 0,
    isPublished: true,
    isPremium: false,
    language: 'Hindi',
    order: 0,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const videos = videosData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags.filter(t => t.trim()),
      };
      
      if (editingVideo?._id) {
        await updateVideo({ id: editingVideo._id, ...payload }).unwrap();
        alert('Video updated successfully!');
      } else {
        await createVideo(payload).unwrap();
        alert('Video created successfully!');
      }
      handleCloseModal();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to save video');
    }
  };

  const handleEdit = (video: any) => {
    setEditingVideo(video);
    setFormData({
      videoTitle: video.videoTitle || '',
      description: video.description || '',
      videoUrl: video.videoUrl || '',
      thumbnail: video.thumbnail || '',
      category: video.category || '',
      subject: video.subject || '',
      instructor: video.instructor || '',
      duration: video.duration || '0:00',
      views: video.views || 0,
      likes: video.likes || 0,
      isPublished: video.isPublished !== undefined ? video.isPublished : true,
      isPremium: video.isPremium || false,
      language: video.language || 'Hindi',
      order: video.order || 0,
      tags: video.tags || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await deleteVideo(id).unwrap();
      alert('Video deleted successfully!');
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to delete video');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
    setFormData({
      videoTitle: '',
      description: '',
      videoUrl: '',
      thumbnail: '',
      category: '',
      subject: '',
      instructor: '',
      duration: '0:00',
      views: 0,
      likes: 0,
      isPublished: true,
      isPremium: false,
      language: 'Hindi',
      order: 0,
      tags: [],
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
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
        <h1 className="text-2xl font-bold text-gray-800">Videos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          + Add Video
        </button>
      </div>

      {/* Videos Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Thumbnail</th>
                <th className="text-left p-4 font-semibold text-gray-700">Title</th>
                <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                <th className="text-center p-4 font-semibold text-gray-700">Duration</th>
                <th className="text-center p-4 font-semibold text-gray-700">Views</th>
                <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    No videos found. Create one to get started.
                  </td>
                </tr>
              ) : (
                videos.map((video: any) => (
                  <tr key={video._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.videoTitle}
                          className="w-20 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">No image</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{video.videoTitle}</div>
                      <div className="text-xs text-gray-500">{video.instructor || 'No instructor'}</div>
                      {video.isPremium && (
                        <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold mt-1">
                          Premium
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-gray-700">{video.category}</div>
                      {video.subject && (
                        <div className="text-xs text-gray-500">{video.subject}</div>
                      )}
                    </td>
                    <td className="p-4 text-center text-gray-700">{video.duration}</td>
                    <td className="p-4 text-center text-gray-700">{video.views || 0}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          video.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {video.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(video)}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(video._id)}
                          className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingVideo ? 'Edit Video' : 'Add New Video'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    value={formData.videoTitle}
                    onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    placeholder="e.g., Introduction to History"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Video URL * (YouTube or Direct Link)
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    placeholder="https://youtube.com/watch?v=... or https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="e.g., History"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="e.g., Ancient India"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    >
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Instructor
                    </label>
                    <input
                      type="text"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="e.g., Dr. Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Duration (MM:SS)
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="e.g., 15:30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    rows={3}
                    placeholder="Video description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="Add tag and press Enter"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span className="text-sm font-semibold text-gray-900">Published</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span className="text-sm font-semibold text-gray-900">Premium Content</span>
                  </label>
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
                  {editingVideo ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
