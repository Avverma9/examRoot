import { useState } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    siteName: 'ExamRoot',
    adminEmail: 'admin@examroot.cc',
    maintenanceMode: false,
    allowRegistration: true,
    defaultTestDuration: 60,
    resultsVisibility: 'immediate',
  })

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = (e) => {
    e.preventDefault()
    alert('Settings saved successfully!')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure panel and app settings</p>
      </div>

      <form className="form-card" onSubmit={handleSave}>
        <h3>General Settings</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => handleChange('adminEmail', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Default Test Duration (minutes)</label>
            <input
              type="number"
              value={settings.defaultTestDuration}
              onChange={(e) => handleChange('defaultTestDuration', Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Results Visibility</label>
            <select
              value={settings.resultsVisibility}
              onChange={(e) => handleChange('resultsVisibility', e.target.value)}
            >
              <option value="immediate">Immediate</option>
              <option value="after-completion">After Completion</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        <h3 className="mt-4">Platform Controls</h3>
        <div className="toggle-list">
          <div className="toggle-row">
            <div>
              <p className="toggle-label">Maintenance Mode</p>
              <p className="toggle-desc">Disable app access for all users</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="toggle-row">
            <div>
              <p className="toggle-label">Allow New Registration</p>
              <p className="toggle-desc">Let new users sign up on the app</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => handleChange('allowRegistration', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            <i className="fa-solid fa-floppy-disk"></i> Save Settings
          </button>
        </div>
      </form>

      <div className="form-card danger-zone">
        <h3>Danger Zone</h3>
        <p className="text-muted">These actions are irreversible. Be careful.</p>
        <div className="danger-actions">
          <div className="danger-row">
            <div>
              <p className="danger-label">Clear All Cache</p>
              <p className="danger-desc">Remove all cached data from the panel</p>
            </div>
            <button className="btn btn-danger" onClick={() => alert('Cache cleared!')}>
              Clear Cache
            </button>
          </div>
          <div className="danger-row">
            <div>
              <p className="danger-label">Export Database</p>
              <p className="danger-desc">Download a JSON backup of all data</p>
            </div>
            <button className="btn btn-danger" onClick={() => alert('Export started!')}>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
