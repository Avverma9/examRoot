import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useGetAllVideosQuery } from '../services/videoApi'
import { useGetAllPracticeSetsQuery } from '../services/practiceSetApi'
import { useGetAllMockTestsQuery } from '../services/mockTestApi'
import {
  useGetAdminStatsQuery,
  useGetDailyActivityQuery,
  useGetTopContentQuery,
  useGetUserGrowthQuery,
} from '../services/adminApi'

// ── Tiny bar-chart row ────────────────────────────────────────────────────────
function BarRow({ label, value, max, color = '#6366f1', suffix = '' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: '#374151' }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

// ── Compact stat pill ─────────────────────────────────────────────────────────
function Pill({ label, value, color }) {
  return (
    <div style={{ backgroundColor: color + '18', border: `1px solid ${color}30`, borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 110 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function Analytics() {
  const [days, setDays] = useState(30)

  const { data: videosData,   isLoading: vL, isError: vE } = useGetAllVideosQuery()
  const { data: practiceData, isLoading: pL, isError: pE } = useGetAllPracticeSetsQuery()
  const { data: mockData,     isLoading: mL, isError: mE } = useGetAllMockTestsQuery()
  const { data: statsData,    isLoading: sL, isError: sE } = useGetAdminStatsQuery()
  const { data: actData,      isLoading: aL }              = useGetDailyActivityQuery(days)
  const { data: topData,      isLoading: tL }              = useGetTopContentQuery()
  const { data: growthData,   isLoading: gL }              = useGetUserGrowthQuery(days)

  const isLoading = vL || pL || mL || sL
  const isError   = vE || pE || mE || sE

  if (isLoading) return <LoadingSpinner />
  if (isError)   return <ErrorMessage message="Failed to load analytics" />

  const videos       = videosData?.data   || []
  const practiceSets = practiceData?.data || []
  const mockTests    = mockData?.data     || []
  const stats        = statsData?.data    || {}
  const activity     = actData?.data      || []
  const growth       = growthData?.data   || []
  const topContent   = topData?.data      || {}

  // ── Content-level aggregations (unchanged from before) ────────────────────
  const categoryCounts = {}
  videos.forEach((v)   => { categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1 })
  mockTests.forEach((t) => { categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1 })

  const levelCounts = { easy: 0, medium: 0, hard: 0 }
  practiceSets.forEach((s) => { if (s.level in levelCounts) levelCounts[s.level]++ })

  const subjectCounts = {}
  practiceSets.forEach((s) => { subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1 })

  const totalVideoViews = videos.reduce((s, v) => s + (v.views || 0), 0)
  const totalQuestions  =
    practiceSets.reduce((s, x) => s + (x.totalQuestions || 0), 0) +
    mockTests.reduce((s, x) => s + (x.totalQuestions || 0), 0)

  // ── Chart helpers ─────────────────────────────────────────────────────────
  const maxAct   = Math.max(...activity.map((d) => d.total), 1)
  const maxGrowth = Math.max(...growth.map((d) => d.newUsers), 1)

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Real-time platform performance</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                backgroundColor: days === d ? '#6366f1' : '#f3f4f6',
                color: days === d ? '#fff' : '#374151',
                border: 'none',
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── USER ACTIVITY SUMMARY PILLS ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Pill label="Total Users"     value={stats.totalUsers ?? 0}                          color="#6366f1" />
        <Pill label="Active Today"    value={stats.activeToday ?? 0}                          color="#10b981" />
        <Pill label={`Active ${days}d`} value={stats.activeLast7 ?? 0}                        color="#f59e0b" />
        <Pill label="Tests Done"      value={(stats.testsAttempted ?? 0)}                    color="#ef4444" />
        <Pill label="Practice Done"   value={(stats.practiceAttempted ?? 0)}                 color="#8b5cf6" />
        <Pill label="Avg Accuracy"    value={`${stats.avgAccuracy ?? 0}%`}                   color="#059669" />
        <Pill label="Total Views"     value={(stats.totalVideoViews ?? 0).toLocaleString()}  color="#3b82f6" />
      </div>

      {/* ── CONTENT SUMMARY ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div>
              <p className="stat-title">Total Video Views</p>
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

        {/* ── DAILY ACTIVITY CHART ── */}
        <div className="section-card">
          <div className="section-header">
            <h3>Daily Activity (Last {days} days)</h3>
            {aL && <span style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</span>}
          </div>
          {activity.length === 0
            ? <p className="empty-text">No activity data yet</p>
            : <div style={{ maxHeight: 340, overflowY: 'auto', padding: '4px 0' }}>
                {activity.map((d) => (
                  <BarRow key={d.date} label={d.date.slice(5)} value={d.total} max={maxAct} color="#6366f1" />
                ))}
              </div>
          }
        </div>

        {/* ── USER GROWTH CHART ── */}
        <div className="section-card">
          <div className="section-header">
            <h3>New Users per Day (Last {days} days)</h3>
            {gL && <span style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</span>}
          </div>
          {growth.length === 0
            ? <p className="empty-text">No registration data</p>
            : <div style={{ maxHeight: 340, overflowY: 'auto', padding: '4px 0' }}>
                {growth.map((d) => (
                  <BarRow key={d.date} label={d.date.slice(5)} value={d.newUsers} max={maxGrowth} color="#10b981" />
                ))}
              </div>
          }
        </div>

        {/* ── TOP MOCK TESTS ── */}
        <div className="section-card">
          <div className="section-header">
            <h3>Top Mock Tests by Attempts</h3>
            {tL && <span style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</span>}
          </div>
          <div className="list-container">
            {(topContent.topTests || []).length === 0
              ? <p className="empty-text">No attempt data yet</p>
              : (topContent.topTests || []).map((t, i) => (
                  <div key={t._id} className="list-item">
                    <div className="list-item-info">
                      <p className="list-item-title">{i + 1}. {t.title || 'Untitled'}</p>
                      <p className="list-item-meta">Avg accuracy: {Math.round(t.avgAccuracy ?? 0)}%</p>
                    </div>
                    <span className="badge-count">{t.attempts} attempts</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* ── TOP VIDEOS ── */}
        <div className="section-card">
          <div className="section-header">
            <h3>Top Videos by Views</h3>
          </div>
          <div className="list-container">
            {(topContent.topVideos || []).length === 0
              ? <p className="empty-text">No views yet</p>
              : (topContent.topVideos || []).map((v, i) => (
                  <div key={v._id} className="list-item">
                    <div className="list-item-info">
                      <p className="list-item-title">{i + 1}. {v.videoTitle}</p>
                      <p className="list-item-meta">{v.category}</p>
                    </div>
                    <span className="badge-count">👁 {(v.views || 0).toLocaleString()}</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* ── TOP PRACTICE SETS ── */}
        <div className="section-card">
          <div className="section-header">
            <h3>Top Practice Sets</h3>
          </div>
          <div className="list-container">
            {(topContent.topPractice || []).length === 0
              ? <p className="empty-text">No completion data yet</p>
              : (topContent.topPractice || []).map((p, i) => (
                  <div key={p._id} className="list-item">
                    <div className="list-item-info">
                      <p className="list-item-title">{i + 1}. {p.title || 'Untitled'}</p>
                    </div>
                    <span className="badge-count">{p.completions} done</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* ── CONTENT BY CATEGORY ── */}
        <div className="section-card">
          <div className="section-header">
            <h3>Content by Category</h3>
          </div>
          <div className="list-container">
            {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} className="list-item">
                <div className="list-item-info">
                  <p className="list-item-title">{cat}</p>
                </div>
                <span className="badge-count">{count}</span>
              </div>
            ))}
            {Object.keys(categoryCounts).length === 0 && <p className="empty-text">No category data</p>}
          </div>
        </div>

        {/* ── DIFFICULTY DISTRIBUTION ── */}
        <div className="section-card">
          <div className="section-header">
            <h3>Difficulty Distribution</h3>
          </div>
          <div className="list-container">
            {Object.entries(levelCounts).map(([level, count]) => (
              <div key={level} className="list-item">
                <div className="list-item-info">
                  <p className="list-item-title" style={{ textTransform: 'capitalize' }}>{level}</p>
                </div>
                <span className={`level-badge ${level}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SUBJECTS BREAKDOWN ── */}
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
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).map(([subject, count]) => (
                  <tr key={subject}>
                    <td>{subject}</td>
                    <td>{count}</td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(count / practiceSets.length) * 100}%`, backgroundColor: '#3b82f6' }}
                        />
                        <span>{Math.round((count / practiceSets.length) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {Object.keys(subjectCounts).length === 0 && (
                  <tr><td colSpan={3} className="empty-text">No subject data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
