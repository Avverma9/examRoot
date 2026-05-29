import { NavLink } from 'react-router-dom'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: 'fa-solid fa-gauge' },
  { path: '/videos', label: 'Videos', icon: 'fa-solid fa-video' },
  { path: '/practice', label: 'Practice Sets', icon: 'fa-solid fa-book-open' },
  { path: '/mock-tests', label: 'Mock Tests', icon: 'fa-solid fa-clipboard-list' },
  { path: '/analytics', label: 'Analytics', icon: 'fa-solid fa-chart-line' },
  { path: '/settings', label: 'Settings', icon: 'fa-solid fa-gear' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <i className="fa-solid fa-graduation-cap brand-icon"></i>
        <span className="brand-text">ExamRoot</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
            end={item.path === '/'}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="admin-badge">
          <i className="fa-solid fa-shield-halved"></i>
          <span>Admin Panel</span>
        </div>
      </div>
    </aside>
  )
}
