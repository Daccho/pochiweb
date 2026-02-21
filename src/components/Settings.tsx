import React from 'react'
import './Settings.css'

interface SettingsProps {
  onClose: () => void
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      <p>API Key is managed by the server.</p>
      
      <div className="settings-actions">
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default Settings
