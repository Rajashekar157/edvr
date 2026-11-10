
import React, { useState, useEffect } from "react";
import "./Sidebar.css";

import {
  FiGrid,
  FiUploadCloud,
  FiBox,
  FiFolder,
  FiSettings,
  FiHelpCircle,
  FiLayers,
  FiMenu,
  FiX
} from "react-icons/fi";

function Sidebar({ activePage, setActivePage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  const handleNavigation = (page) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="edvr-sidebar"
        >
          <FiMenu />
        </button>

        <div className="mobile-brand">
          <strong>EDVR</strong>
          <span>INTERIOR STUDIO</span>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="edvr-sidebar"
        className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="brand">
          <div className="brand-icon">
            <FiLayers />
          </div>

          <div>
            <h2>EDVR</h2>
            <span>INTERIOR STUDIO</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          <FiX />
        </button>

        <div className="menu-label">WORKSPACE</div>

        <nav aria-label="Main navigation">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`menu-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => handleNavigation(item.name)}
              aria-current={
                activePage === item.name ? "page" : undefined
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {bottomItems.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`menu-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => handleNavigation(item.name)}
              aria-current={
                activePage === item.name ? "page" : undefined
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
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
    </>
  );
}

export default Sidebar;
