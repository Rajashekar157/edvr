import React from "react";
import {
  FiFolder,

  FiBox,

  FiPlus,
  FiArrowUpRight,
  FiImage,
  FiHome
} from "react-icons/fi";

import "./Dashboard.css";
const projects = [
  {
    name: "Modern Living Room",
    room: "Hall",
    style: "Modern Minimalist",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=700",
    status: "Completed"
  },
  {
    name: "Luxury Kitchen",
    room: "Kitchen",
    style: "Contemporary",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700",
    status: "In Progress"
  },
  {
    name: "Master Bedroom",
    room: "Bedroom",
    style: "Scandinavian",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700",
    status: "Completed"
  }
];

function Dashboard() {
  return (
    <div className="dashboard">

      <header className="top-header">
        <div>
          <h1>Dashboard</h1>
          <p>Design your dream spaces with AI-powered 3D visualization.</p>
        </div>

        <button className="primary-btn">
          <FiPlus /> New Project
        </button>
      </header>

      <section className="welcome-banner">
        <div>
          <span className="banner-tag">AI INTERIOR DESIGN STUDIO</span>
          <h2>Imagine it. Design it. Visualize it.</h2>
          <p>
            Transform your room photographs into beautiful
            interactive 3D spaces.
          </p>

          <button className="banner-btn">
            Start Designing <FiArrowUpRight />
          </button>
        </div>

        <img
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900"
          alt="Interior design"
        />
      </section>

      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon purple"><FiFolder /></div>
          <span>Total Projects</span>
          <h2>12</h2>
          <small>All your design projects</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><FiBox /></div>
          <span>3D Models</span>
          <h2>08</h2>
          <small>Generated room models</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><FiImage /></div>
          <span>Uploaded Images</span>
          <h2>36</h2>
          <small>Room reference photos</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><FiHome /></div>
          <span>Rooms Designed</span>
          <h2>18</h2>
          <small>Across all projects</small>
        </div>

      </section>

      <section className="projects-section">

        <div className="section-heading">
          <div>
            <h2>Recent Projects</h2>
            <p>Continue working on your interior designs.</p>
          </div>

          <button className="view-all">View all projects</button>
        </div>

        <div className="projects-grid">

          {projects.map((project, index) => (
            <div className="project-card" key={index}>

              <div className="project-image">
                <img src={project.image} alt={project.name} />

                <span className={`project-status ${
                  project.status === "Completed" ? "completed" : "progress"
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="project-info">
                <div>
                  <h3>{project.name}</h3>
                  <p>{project.room} · {project.style}</p>
                </div>

                <button className="project-arrow">
                  <FiArrowUpRight />
                </button>
              </div>

            </div>
          ))}

        </div>
      </section>

    </div>
  );
}

export default Dashboard;