import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaFilter, FaChevronDown, FaChevronUp, FaDownload, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import './ProjectsDashboard.css';

const ProjectsDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();
  const userEmail = location.state?.email || '';
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    academicYear: '',
    amountThreshold: '',
    facultyName: '',
    industryName: ''
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbx98tTpPC06vyGozSp6-tXGLx0td7tc0xBHqf6CZNvw1WFShzj6hzIpt7C1tyImKTg3/exec";
        
        const response = await fetch(`${scriptUrl}?action=getProjects&email=${encodeURIComponent(userEmail)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result === 'success') {
          const userProjects = Array.isArray(data.data) 
            ? data.data.filter(project => project.Email === userEmail) 
            : [];
          setProjects(userProjects);
          setFilteredProjects(userProjects);
        } else {
          throw new Error(data.error || 'Failed to fetch projects');
        }
      } catch (err) {
        setError(err.message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchProjects();
    } else {
      setError('No user email found');
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    let result = [...projects];
    
    if (filters.academicYear) {
      result = result.filter(project => project['Academic Year'].toString() === filters.academicYear.toString());
    }
    
    if (filters.amountThreshold) {
      const threshold = parseInt(filters.amountThreshold.replace(/,|₹/g, ''));
      result = result.filter(project => {
        const amountStr = project['Amount Sanctioned']?.toString() || '0';
        const amount = parseInt(amountStr.replace(/,|₹/g, '')) || 0;
        return amount >= threshold;
      });
    }
    
    if (filters.facultyName) {
      result = result.filter(project => {
        const faculty = project['Principal Investigator'] || '';
        return faculty.toString().toLowerCase().includes(filters.facultyName.toLowerCase());
      });
    }
    
    if (filters.industryName) {
      result = result.filter(project => {
        const industry = project['Industry Name'] || '';
        return industry.toString().toLowerCase().includes(filters.industryName.toLowerCase());
      });
    }
    
    setFilteredProjects(result);
  }, [filters, projects]);

  const handleDelete = async (project) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbx1RMehuYKVz9PZM3n6VtJnAo-Vcr73HVdSCXDPbWFEjc5q0zx8awhW5fNk-JGz0Zr7/exec";
        
        const bodyData = `action=deleteProject&title=${encodeURIComponent(project['Project Title'])}&email=${encodeURIComponent(userEmail)}`;
  
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyData
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
  
        if (data.result === 'success') {
          setProjects(prevProjects => 
            prevProjects.filter(p => p['Project Title'] !== project['Project Title'])
          );
          alert(`Successfully deleted ${data.deletedCount} project(s)`);
        } else {
          throw new Error(data.error || 'Failed to delete project');
        }
      } catch (err) {
        alert('Error deleting project: ' + err.message);
        console.error('Delete error:', err);
      }
    }
  };
  

  const handleEdit = (project) => {
    navigate('/form', { 
      state: {
        Email: userEmail, 
        editMode: true, 
        projectData: project,
      } 
    });
  };

  const handleAddNew = () => {
    navigate('/form', { 
      state: {
        Email: userEmail, 
        editMode: false,
      } 
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadCSV = () => {
    if (filteredProjects.length === 0) {
      alert('No projects to download with current filters');
      return;
    }

    const headers = Object.keys(filteredProjects[0]).filter(
      key => !['id', 'Email'].includes(key)
    );

    let csvContent = headers.join(',') + '\n';

    filteredProjects.forEach(project => {
      const row = headers.map(header => {
        const value = project[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `projects_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setFilters({
      academicYear: '',
      amountThreshold: '',
      facultyName: '',
      industryName: ''
    });
  };

  const LogOut = () =>
    {
      navigate("/");
    }
  const academicYears = [...new Set(projects.map(p => p['Academic Year']))].filter(Boolean);

  if (loading) return <div className="loading">Loading projects...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <h1>My Consultancy Projects</h1>
      
      <div className="dashboard-actions">
        <button className="action-btn primary" onClick={handleAddNew}>
          <FaPlus className="icon" /> Add New Project
        </button>
        <button className="action-btn secondary" onClick={downloadCSV}>
          <FaDownload className="icon" /> Download CSV
        </button>
        
        <div className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
          <FaFilter className="icon" />
          {showFilters ? <FaChevronUp className="arrow" /> : <FaChevronDown className="arrow" />}
          <span>Filters</span>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Academic Year</label>
              <select
                name="academicYear"
                value={filters.academicYear}
                onChange={handleFilterChange}
              >
                <option value="">All Years</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Min Amount</label>
              <select
                name="amountThreshold"
                value={filters.amountThreshold}
                onChange={handleFilterChange}
              >
                <option value="">Any Amount</option>
                <option value="50,000">₹50,000+</option>
                <option value="1,00,000">₹1,00,000+</option>
                <option value="2,00,000">₹2,00,000+</option>
                <option value="5,00,000">₹5,00,000+</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Coordinator Name</label>
              <input
                type="text"
                name="facultyName"
                placeholder="Search faculty..."
                value={filters.facultyName}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Industry Name</label>
              <input
                type="text"
                name="industryName"
                placeholder="Search industry..."
                value={filters.industryName}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button className="reset-btn" onClick={resetFilters}>
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      <div className="projects-list">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-info" onClick={() => handleEdit(project)}>
                <h3>{project['Project Title']}</h3>
                <p><strong>Industry:</strong> {project['Industry Name']}</p>
                <p><strong>Year:</strong> {project['Academic Year']}</p>
                <p><strong>Amount:</strong> ₹{project['Amount Sanctioned']}</p>
                <p><strong>Faculty:</strong> {project['Principal Investigator']}</p>
              </div>
              <div className="project-actions">
                <button 
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                > Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project);
                  }}
                > Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-projects">
            {projects.length === 0 
              ? 'No projects found. Add a new project to get started.' 
              : 'No projects match the current filters.'}
          </p>
        )}
      </div>
      <br></br>
      <br></br>
      <button onClick={LogOut}  className="logout-button">
        Log Out
        </button>
    </div>
  );
};

export default ProjectsDashboard;