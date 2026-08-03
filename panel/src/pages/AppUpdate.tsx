import React, { useState } from 'react';
import {
  useGetAllUpdatesQuery,
  useCreateUpdateMutation,
  useUpdateUpdateMutation,
  useDeleteUpdateMutation,
  usePushUpdateMutation,
  useGetUsersByVersionQuery,
  useGetUpdateStatsQuery,
} from '../store/api';

interface AppUpdateData {
  _id?: string;
  version: string;
  versionCode: number;
  downloadLink: string;
  description: string;
  changelogHindi: string;
  changelogEnglish: string;
  isActive: boolean;
  isMandatory: boolean;
}

export default function AppUpdate() {
  const { data: updatesData, isLoading } = useGetAllUpdatesQuery(undefined);
  const [createUpdate] = useCreateUpdateMutation();
  const [updateUpdate] = useUpdateUpdateMutation();
  const [deleteUpdate] = useDeleteUpdateMutation();
  const [pushUpdate] = usePushUpdateMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<AppUpdateData | null>(null);
  const [formData, setFormData] = useState<AppUpdateData>({
    version: '',
    versionCode: 1,
    downloadLink: '',
    description: '',
    changelogHindi: '',
    changelogEnglish: '',
    isActive: true,
    isMandatory: false,
  });

  const [activeTab, setActiveTab] = useState<'updates' | 'users' | 'stats'>('updates');
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);

  const { data: usersData } = useGetUsersByVersionQuery(undefined, {
    skip: activeTab !== 'users',
  });
  const { data: statsData } = useGetUpdateStatsQuery(selectedUpdateId!, {
    skip: activeTab !== 'stats' || !selectedUpdateId,
  });

  const updates = updatesData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUpdate?._id) {
        await updateUpdate({ id: editingUpdate._id, ...formData }).unwrap();
        alert('Update updated successfully!');
      } else {
        await createUpdate(formData).unwrap();
        alert('Update created successfully!');
      }
      handleCloseModal();
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to save update');
    }
  };

  const handleEdit = (update: any) => {
    setEditingUpdate(update);
    setFormData({
      version: update.version,
      versionCode: update.versionCode || 1,
      downloadLink: update.downloadLink,
      description: update.description || '',
      changelogHindi: update.changelogHindi || '',
      changelogEnglish: update.changelogEnglish || '',
      isActive: update.isActive,
      isMandatory: update.isMandatory || false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return;
    try {
      await deleteUpdate(id).unwrap();
      alert('Update deleted successfully!');
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to delete update');
    }
  };

  const handlePush = async (id: string) => {
    if (!confirm('Push this update to all users? They will see the update dialog again.')) return;
    try {
      await pushUpdate(id).unwrap();
      alert('Update pushed to all users!');
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to push update');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUpdate(null);
    setFormData({
      version: '',
      versionCode: 1,
      downloadLink: '',
      description: '',
      changelogHindi: '',
      changelogEnglish: '',
      isActive: true,
      isMandatory: false,
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
        <h1 className="text-2xl font-bold text-gray-800">App Updates & User Tracking</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          + Create Update
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { key: 'updates', label: 'App Updates' },
            { key: 'users', label: 'User Versions' },
            { key: 'stats', label: 'Update Stats' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'updates' && renderUpdatesTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'stats' && renderStatsTab()}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingUpdate ? 'Edit Update' : 'Create New Update'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Version *
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="e.g., 1.0.5"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Version Code *
                    </label>
                    <input
                      type="number"
                      value={formData.versionCode}
                      onChange={(e) => setFormData({ ...formData, versionCode: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="e.g., 10005"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Download Link *
                  </label>
                  <input
                    type="url"
                    value={formData.downloadLink}
                    onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    rows={2}
                    placeholder="Brief description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Changelog (English)
                  </label>
                  <textarea
                    value={formData.changelogEnglish}
                    onChange={(e) => setFormData({ ...formData, changelogEnglish: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    rows={4}
                    placeholder="What's new in this version..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Changelog (Hindi)
                  </label>
                  <textarea
                    value={formData.changelogHindi}
                    onChange={(e) => setFormData({ ...formData, changelogHindi: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    rows={4}
                    placeholder="इस संस्करण में क्या नया है..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <label htmlFor="isActive" className="text-sm font-semibold text-gray-900">
                      Mark as Active (show to all users)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isMandatory"
                      checked={formData.isMandatory}
                      onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                      className="w-4 h-4 text-red-600"
                    />
                    <label htmlFor="isMandatory" className="text-sm font-semibold text-gray-900">
                      Mandatory Update (users cannot skip)
                    </label>
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
                  {editingUpdate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function renderUpdatesTab() {
    return (
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-700">Version</th>
              <th className="text-left p-4 font-semibold text-gray-700">Description</th>
              <th className="text-left p-4 font-semibold text-gray-700">Download Link</th>
              <th className="text-center p-4 font-semibold text-gray-700">Status</th>
              <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {updates.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-500">
                  No updates found. Create one to get started.
                </td>
              </tr>
            ) : (
              updates.map((update: any) => (
                <tr key={update._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">
                      {update.version} 
                      <span className="text-xs text-gray-500 ml-2">
                        (Code: {update.versionCode || 'N/A'})
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </div>
                    {update.isMandatory && (
                      <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold mt-1">
                        Mandatory
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-700">
                    {update.description || <span className="text-gray-400 italic">No description</span>}
                  </td>
                  <td className="p-4">
                    <a
                      href={update.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {update.downloadLink}
                    </a>
                  </td>
                  <td className="p-4 text-center">
                    {update.isActive ? (
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(update)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUpdateId(update._id);
                          setActiveTab('stats');
                        }}
                        className="text-green-600 hover:text-green-800 px-3 py-1 rounded hover:bg-green-50 transition"
                      >
                        Stats
                      </button>
                      {!update.isActive && (
                        <button
                          onClick={() => handlePush(update._id)}
                          className="text-orange-600 hover:text-orange-800 px-3 py-1 rounded hover:bg-orange-50 transition"
                        >
                          Push
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(update._id)}
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
    );
  }

  function renderUsersTab() {
    if (!usersData) {
      return <div className="text-center py-8 text-gray-500">Loading user data...</div>;
    }

    const { versionStats, totalUsers } = usersData.data;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            User Distribution by App Version ({totalUsers} total users)
          </h3>
          <div className="grid gap-4">
            {versionStats.map((stat: any) => (
              <div key={stat.version} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-900">
                    Version {stat.version} 
                    <span className="text-sm text-gray-500 ml-2">
                      (Code: {stat.versionCode || 'N/A'})
                    </span>
                  </h4>
                  <span className="text-2xl font-bold text-blue-600">{stat.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(stat.count / totalUsers) * 100}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">
                  {((stat.count / totalUsers) * 100).toFixed(1)}% of users
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderStatsTab() {
    if (!selectedUpdateId) {
      return (
        <div className="text-center py-8 text-gray-500">
          Select an update from the Updates tab to view statistics
        </div>
      );
    }

    if (!statsData) {
      return <div className="text-center py-8 text-gray-500">Loading stats...</div>;
    }

    const stats = statsData.data;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistics for Version {stats.update.version}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-sm text-blue-600">Total App Users</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.usersOnThisVersion}</div>
              <div className="text-sm text-green-600">On This Version</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.installedCount}</div>
              <div className="text-sm text-orange-600">Confirmed Installs</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.dismissedCount}</div>
              <div className="text-sm text-gray-600">Dismissed Updates</div>
            </div>
          </div>

          {stats.installedUsers?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Recent Installs</h4>
              <div className="space-y-2">
                {stats.installedUsers.slice(0, 5).map((install: any) => (
                  <div key={install.userId._id} className="flex justify-between text-sm">
                    <span>{install.userId.name} ({install.userId.email})</span>
                    <span className="text-gray-500">
                      {new Date(install.installedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
