
import React, { useState } from "react";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import RoomUpload from "./pages/RoomUpload";
import InteriorEditor from "./pages/InteriorEditor";
import MyProjects from "./pages/MyProjects";
import HelpSupport from "./pages/HelpSupport";
import Settings from "./pages/Settings";

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;

      case "Upload Room":
        return <RoomUpload />;

      case "3D Interior Editor":
        return <InteriorEditor />;

      case "My Projects":
        return <MyProjects />;

      case "Help & Support":
        return <HelpSupport />;

      case "Settings":
        return <Settings />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <div className="app-container">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
        />

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
