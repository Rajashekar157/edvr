
import React, { useState } from "react";
import {
  FiUser,
  FiSettings as FiSettingsIcon,
  FiBell,
  FiMonitor,
  FiSave
} from "react-icons/fi";
import "./Settings.css";

function Settings() {
  const [profile, setProfile] = useState({
    name: "Interior Designer",
    email: "",
    workspace: "Personal Workspace"
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    projectUpdates: true,
    compactView: false
  });

  const updateProfile = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const updatePreference = key => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Manage your profile and EDVR workspace preferences.</p>
      </header>

      <div className="settings-layout">

        <section className="settings-card">
          <div className="settings-card-heading">
            <FiUser />
            <div>
              <h2>Profile Information</h2>
              <p>Manage your personal workspace details.</p>
            </div>
          </div>

          <div className="settings-form">
            <label>Display Name</label>
            <input
              value={profile.name}
              onChange={e => updateProfile("name", e.target.value)}
              placeholder="Enter your name"
            />

            <label>Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => updateProfile("email", e.target.value)}
              placeholder="Enter your email"
            />

            <label>Workspace Name</label>
            <input
              value={profile.workspace}
              onChange={e => updateProfile("workspace", e.target.value)}
              placeholder="Workspace name"
            />
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <FiBell />
            <div>
              <h2>Notifications</h2>
              <p>Choose which updates you want to see.</p>
            </div>
          </div>

          <div className="settings-option">
            <div>
              <strong>General Notifications</strong>
              <p>Receive workspace notifications.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={() => updatePreference("notifications")}
            />
          </div>

          <div className="settings-option">
            <div>
              <strong>Project Updates</strong>
              <p>Receive updates about your design projects.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.projectUpdates}
              onChange={() => updatePreference("projectUpdates")}
            />
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <FiMonitor />
            <div>
              <h2>Display Preferences</h2>
              <p>Customize your workspace appearance.</p>
            </div>
          </div>

          <div className="settings-option">
            <div>
              <strong>Compact View</strong>
              <p>Use a more compact workspace layout.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.compactView}
              onChange={() => updatePreference("compactView")}
            />
          </div>

          <div className="settings-option">
            <div>
              <strong>Application Theme</strong>
              <p>Current theme: Warm Light</p>
            </div>
            <span className="settings-theme-label">Warm Light</span>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <FiSettingsIcon />
            <div>
              <h2>Workspace Information</h2>
              <p>Your current EDVR application details.</p>
            </div>
          </div>

          <div className="workspace-info">
            <div>
              <span>Application</span>
              <strong>EDVR Interior Studio</strong>
            </div>
            <div>
              <span>Workspace Type</span>
              <strong>Personal</strong>
            </div>
            <div>
              <span>Interface Version</span>
              <strong>1.0</strong>
            </div>
          </div>
        </section>

      </div>

      <div className="settings-footer">
        <button
          className="settings-save-btn"
          onClick={() => alert("Settings are currently frontend-only. Backend saving will be integrated later.")}
        >
          <FiSave />
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default Settings;
