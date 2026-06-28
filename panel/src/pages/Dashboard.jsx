import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useGetAllVideosQuery } from '../services/videoApi'
import { useGetAllPracticeSetsQuery } from '../services/practiceSetApi'
import { useGetAllMockTestsQuery } from '../services/mockTestApi'
import { useGetAdminStatsQuery, useGetDailyActivityQuery } from '../services/adminApi'

// Simple inline bar chart — no extra dependency needed
function ActivityBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11, color: '#6b7280' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: videosData,   isLoading: vL, isError: vE } = useGetAllVideosQuery()
  const { data: practiceData, isLoading: pL, isError: pE } = useGetAllPracticeSetsQuery()
  const { data: mockData,     isLoading: mL, isError: mE } = useGetAllMockTestsQuery()
  const { data: statsData,    isLoading: sL, isError: sE } = useGetAdminStatsQuery()
  const { data: activityData, isLoading: aL }              = useGetDailyActivityQuery(14)

  const isLoading = vL || pL || mL || sL
  const isError   = vE || pE || mE || sE

  if (isLoading) return <LoadingSpinner />
  if (isError)   return <ErrorMessage message="Failed to load dashboard data" />

  const videos       = videosData?.data       || []
  const practiceSets = practiceData?.data     || []
  const mockTests    = mockData?.data         || []
  const stats        = statsData?.data        || {}
  const activity     = activityData?.data     || []

  const totalQuestions =
    practiceSets.reduce((s, x) => s + (x.totalQuestions || 0), 0) +
    mockTests.reduce((s, x) => s + (x.totalQuestions || 0), 0)

  const publishedVideos = videos.filter((v) => v.isPublished !== false).length
  const maxActivity     = Math.max(...activity.map((d) => d.total), 1)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">ExamRoot Admin — Live Data</p>
      </div>

      {/* ── USER STATS ROW ── */}
      <div className="stats-grid" style={{ marginBottom: 8 }}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers ?? 0}
          icon="fa-solid fa-users"
          color="#6366f1"
          subtitle={`${stats.activeLast7 ?? 0} active last 7d`}
        />
        <StatCard
          title="Active Today"
          value={stats.activeToday ?? 0}
          icon="fa-solid fa-bolt"
          color="#10b981"
          subtitle={`Avg accuracy ${stats.avgAccuracy ?? 0}%`}
        />
        <StatCard
          title="Tests Attempted"
          value={(stats.testsAttempted ?? 0) + (stats.practiceAttempted ?? 0)}
          icon="fa-solid fa-clipboard-check"
          color="#f59e0b"
          subtitle={`${stats.testsAttempted ?? 0} mock · ${stats.practiceAttempted ?? 0} practice`}
        />
        <StatCard
          title="Video Views"
          value={(stats.totalVideoViews ?? 0).toLocaleString()}
          icon="fa-solid fa-eye"
          color="#3b82f6"
          subtitle={`${stats.videosWatched ?? 0} full watches`}
        />
      </div>

      {/* ── CONTENT STATS ROW ── */}
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

        {/* ── DAILY ACTIVITY CHART (last 14 days) ── */}
        <div className="section-card">
          <div className="section-header">
            <h3>Daily Activity — Last 14 Days</h3>
            {aL && <span style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</span>}
          </div>
          {activity.length === 0 ? (
            <p className="empty-text">No activity data yet</p>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {activity.slice(-14).map((d) => (
                <ActivityBar
                  key={d.date}
                  label={d.date.slice(5)}   /* MM-DD */
                  value={d.total}
                  max={maxActivity}
                  color="#6366f1"
                />
              ))}
            </div>
          )}
        </div>

        {/* ── RECENT VIDEOS ── */}
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
                  <p className="list-item-meta">{video.category} · {video.duration} · 👁 {(video.views || 0).toLocaleString()}</p>
                </div>
                <span className={`status-badge ${video.isPublished !== false ? 'published' : 'draft'}`}>
                  {video.isPublished !== false ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
            {videos.length === 0 && <p className="empty-text">No videos available</p>}
          </div>
        </div>

        {/* ── RECENT MOCK TESTS ── */}
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
                  <tr><td colSpan={5} className="empty-text">No mock tests available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
