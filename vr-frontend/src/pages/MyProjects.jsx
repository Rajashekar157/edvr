
import React, { useState } from "react";
import {
  FiSearch,
  FiGrid,
  FiList,
  FiMoreVertical,
  FiFolder
} from "react-icons/fi";
import "./MyProjects.css";

const projects = [
  {
    name: "Modern Living Room",
    room: "Hall",
    style: "Modern Minimalist",
    status: "Completed",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=700"
  },
  {
    name: "Luxury Kitchen",
    room: "Kitchen",
    style: "Contemporary",
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700"
  },
  {
    name: "Master Bedroom",
    room: "Bedroom",
    style: "Scandinavian",
    status: "Completed",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700"
  },
  {
    name: "Elegant Dining Room",
    room: "Dining Room",
    style: "Modern",
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=700"
  }
];

function MyProjects() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || project.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="my-projects-page">
      <header className="projects-header">
        <div>
          <h1>My Projects</h1>
          <p>Manage and continue working on your interior design projects.</p>
        </div>
      </header>

      <div className="projects-summary">
        <div className="projects-summary-card">
          <FiFolder />
          <div>
            <span>Total Projects</span>
            <h2>{projects.length}</h2>
          </div>
        </div>

        <div className="projects-summary-card">
          <FiGrid />
          <div>
            <span>Completed</span>
            <h2>{projects.filter(p => p.status === "Completed").length}</h2>
          </div>
        </div>

        <div className="projects-summary-card">
          <FiList />
          <div>
            <span>In Progress</span>
            <h2>{projects.filter(p => p.status === "In Progress").length}</h2>
          </div>
        </div>
      </div>

      <section className="projects-content">
        <div className="projects-toolbar">
          <div>
            <h2>All Projects</h2>
            <p>Your saved interior designs</p>
          </div>

          <div className="projects-controls">
            <div className="projects-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="All">All Projects</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>
        </div>

        <div className="my-projects-grid">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <article className="my-project-card" key={index}>
                <div className="my-project-image">
                  <img src={project.image} alt={project.name} />
                  <span className={`my-project-status ${
                    project.status === "Completed" ? "completed" : "progress"
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="my-project-info">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.room} · {project.style}</p>
                  </div>
                  <button type="button" className="project-menu-button" aria-label="Project options">
                    <FiMoreVertical />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="projects-empty">
              <FiFolder />
              <h3>No projects found</h3>
              <p>Try another search or filter.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default MyProjects;
