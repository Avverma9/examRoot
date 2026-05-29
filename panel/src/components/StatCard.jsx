export default function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-card-content">
        <div>
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">{value}</h3>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        </div>
        <div className="stat-icon" style={{ backgroundColor: color + '15', color }}>
          <i className={icon}></i>
        </div>
      </div>
    </div>
  )
}
