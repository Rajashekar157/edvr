
import React from "react";
import "./Sidebar.css";

import {
  FiGrid,
  FiUploadCloud,
  FiBox,
  FiFolder,
  FiSettings,
  FiHelpCircle,
  FiLayers
} from "react-icons/fi";

function Sidebar({ activePage, setActivePage }) {

  const menuItems = [
    { name: "Dashboard", icon: <FiGrid /> },
    { name: "Upload Room", icon: <FiUploadCloud /> },
    { name: "3D Interior Editor", icon: <FiBox /> },
    { name: "My Projects", icon: <FiFolder /> }
  ];

  const bottomItems = [
    { name: "Help & Support", icon: <FiHelpCircle /> },
    { name: "Settings", icon: <FiSettings /> }
  ];

  return (
    <aside className="sidebar">

      <div className="brand">
        <div className="brand-icon">
          <FiLayers />
        </div>

        <div>
          <h2>EDVR</h2>
          <span>INTERIOR STUDIO</span>
        </div>
      </div>

      <div className="menu-label">WORKSPACE</div>

      <nav>
        {menuItems.map(item => (
          <div
            key={item.name}
            className={`menu-item ${
              activePage === item.name ? "active" : ""
            }`}
            onClick={() => setActivePage(item.name)}
          >
            {item.icon}
            <span>{item.name}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">

        {bottomItems.map(item => (
          <div
            key={item.name}
            className={`menu-item ${
              activePage === item.name ? "active" : ""
            }`}
            onClick={() => setActivePage(item.name)}
          >
            {item.icon}
            <span>{item.name}</span>
          </div>
        ))}

        <div className="profile">
          <div className="avatar">ED</div>
          <div>
            <strong>Interior Designer</strong>
            <small>Personal Workspace</small>
          </div>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;
