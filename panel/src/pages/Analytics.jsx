import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useGetAllVideosQuery } from '../services/videoApi'
import { useGetAllPracticeSetsQuery } from '../services/practiceSetApi'
import { useGetAllMockTestsQuery } from '../services/mockTestApi'

export default function Analytics() {
  const { data: videosData, isLoading: vLoading, isError: vError } = useGetAllVideosQuery()
  const { data: practiceData, isLoading: pLoading, isError: pError } = useGetAllPracticeSetsQuery()
  const { data: mockData, isLoading: mLoading, isError: mError } = useGetAllMockTestsQuery()

  const isLoading = vLoading || pLoading || mLoading
  const isError = vError || pError || mError

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message="Failed to load analytics" />

  const videos = videosData?.data || []
  const practiceSets = practiceData?.data || []
  const mockTests = mockData?.data || []

  const categoryCounts = {}
  videos.forEach((v) => {
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1
  })
  mockTests.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1
  })

  const levelCounts = { easy: 0, medium: 0, hard: 0 }
  practiceSets.forEach((s) => {
    if (levelCounts[s.level] !== undefined) {
      levelCounts[s.level]++
    }
  })

  const subjectCounts = {}
  practiceSets.forEach((s) => {
    subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1
  })

  const totalVideoViews = videos.reduce((sum, v) => sum + (v.views || 0), 0)
  const totalQuestions =
    practiceSets.reduce((sum, s) => sum + (s.totalQuestions || 0), 0) +
    mockTests.reduce((sum, t) => sum + (t.totalQuestions || 0), 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Content performance and statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-title">Total Views</p>
              <h3 className="stat-value">{totalVideoViews.toLocaleString()}</h3>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#3b82f615', color: '#3b82f6' }}>
              <i className="fa-solid fa-eye"></i>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-title">Total Questions</p>
              <h3 className="stat-value">{totalQuestions.toLocaleString()}</h3>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
              <i className="fa-solid fa-circle-question"></i>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-title">Categories</p>
              <h3 className="stat-value">{Object.keys(categoryCounts).length}</h3>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}>
              <i className="fa-solid fa-layer-group"></i>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-title">Subjects</p>
              <h3 className="stat-value">{Object.keys(subjectCounts).length}</h3>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6' }}>
              <i className="fa-solid fa-book"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <div className="section-header">
            <h3>Content by Category</h3>
          </div>
          <div className="list-container">
            {Object.entries(categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div key={cat} className="list-item">
                  <div className="list-item-info">
                    <p className="list-item-title">{cat}</p>
                  </div>
                  <span className="badge-count">{count}</span>
                </div>
              ))}
            {Object.keys(categoryCounts).length === 0 && (
              <p className="empty-text">No category data available</p>
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h3>Difficulty Distribution</h3>
          </div>
          <div className="list-container">
            {Object.entries(levelCounts).map(([level, count]) => (
              <div key={level} className="list-item">
                <div className="list-item-info">
                  <p className="list-item-title capitalize">{level}</p>
                </div>
                <span className={`level-badge ${level}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card full-width">
          <div className="section-header">
            <h3>Subjects Breakdown</h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Practice Sets</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(subjectCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([subject, count]) => (
                    <tr key={subject}>
                      <td>{subject}</td>
                      <td>{count}</td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(count / practiceSets.length) * 100}%`,
                              backgroundColor: '#3b82f6',
                            }}
                          />
                          <span>{Math.round((count / practiceSets.length) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                {Object.keys(subjectCounts).length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-text">No subject data available</td>
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
