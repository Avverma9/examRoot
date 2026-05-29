import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useGetAllVideosQuery } from '../services/videoApi'
import { useGetAllPracticeSetsQuery } from '../services/practiceSetApi'
import { useGetAllMockTestsQuery } from '../services/mockTestApi'

export default function Dashboard() {
  const {
    data: videosData,
    isLoading: videosLoading,
    isError: videosError,
  } = useGetAllVideosQuery()

  const {
    data: practiceData,
    isLoading: practiceLoading,
    isError: practiceError,
  } = useGetAllPracticeSetsQuery()

  const {
    data: mockData,
    isLoading: mockLoading,
    isError: mockError,
  } = useGetAllMockTestsQuery()

  const isLoading = videosLoading || practiceLoading || mockLoading
  const isError = videosError || practiceError || mockError

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message="Failed to load dashboard data" />

  const videos = videosData?.data || []
  const practiceSets = practiceData?.data || []
  const mockTests = mockData?.data || []

  const totalQuestions =
    practiceSets.reduce((sum, set) => sum + (set.totalQuestions || 0), 0) +
    mockTests.reduce((sum, test) => sum + (test.totalQuestions || 0), 0)

  const publishedVideos = videos.filter((v) => v.isPublished !== false).length

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome to ExamRoot Admin Panel</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Videos"
          value={videos.length}
          icon="fa-solid fa-video"
          color="#3b82f6"
          subtitle={`${publishedVideos} published`}
        />
        <StatCard
          title="Practice Sets"
          value={practiceSets.length}
          icon="fa-solid fa-book-open"
          color="#10b981"
          subtitle={`${totalQuestions} total questions`}
        />
        <StatCard
          title="Mock Tests"
          value={mockTests.length}
          icon="fa-solid fa-clipboard-list"
          color="#f59e0b"
          subtitle={`${mockTests.reduce((s, t) => s + (t.duration || 0), 0)} total mins`}
        />
        <StatCard
          title="Total Content"
          value={videos.length + practiceSets.length + mockTests.length}
          icon="fa-solid fa-database"
          color="#8b5cf6"
          subtitle="All resources"
        />
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <div className="section-header">
            <h3>Recent Videos</h3>
            <span className="badge">{videos.length}</span>
          </div>
          <div className="list-container">
            {videos.slice(0, 5).map((video) => (
              <div key={video._id} className="list-item">
                <div className="list-item-info">
                  <p className="list-item-title">{video.videoTitle}</p>
                  <p className="list-item-meta">{video.category} · {video.duration}</p>
                </div>
                <span className={`status-badge ${video.isPublished !== false ? 'published' : 'draft'}`}>
                  {video.isPublished !== false ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
            {videos.length === 0 && (
              <p className="empty-text">No videos available</p>
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h3>Recent Practice Sets</h3>
            <span className="badge">{practiceSets.length}</span>
          </div>
          <div className="list-container">
            {practiceSets.slice(0, 5).map((set) => (
              <div key={set._id} className="list-item">
                <div className="list-item-info">
                  <p className="list-item-title">{set.title}</p>
                  <p className="list-item-meta">{set.subject} · {set.topic} · {set.level}</p>
                </div>
                <span className="badge-count">{set.totalQuestions || 0} Qs</span>
              </div>
            ))}
            {practiceSets.length === 0 && (
              <p className="empty-text">No practice sets available</p>
            )}
          </div>
        </div>

        <div className="section-card full-width">
          <div className="section-header">
            <h3>Recent Mock Tests</h3>
            <span className="badge">{mockTests.length}</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTests.slice(0, 5).map((test) => (
                  <tr key={test._id}>
                    <td>{test.title}</td>
                    <td>{test.category}</td>
                    <td>{test.duration} min</td>
                    <td>{test.totalQuestions || 0}</td>
                    <td>
                      <span className={`status-badge ${test.isPublished !== false ? 'published' : 'draft'}`}>
                        {test.isPublished !== false ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
                {mockTests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-text">No mock tests available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
