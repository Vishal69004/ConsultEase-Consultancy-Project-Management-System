import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  FileDownload as DownloadIcon,
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [userProjectMap, setUserProjectMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: '',
    amountThreshold: '',
    industryName: '',
    facultyName: '',
  });

  // Fetch all projects and create user-project mapping
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbx98tTpPC06vyGozSp6-tXGLx0td7tc0xBHqf6CZNvw1WFShzj6hzIpt7C1tyImKTg3/exec";
        
        const response = await fetch(`${scriptUrl}?action=getProjects`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result === 'success') {
          const userProjects = Array.isArray(data.data) ? data.data : [];
          setProjects(userProjects);
          setFilteredProjects(userProjects);
          
          // Create user-project mapping
          const mapping = {};
          userProjects.forEach(project => {
            if (!mapping[project.Email]) {
              mapping[project.Email] = [];
            }
            mapping[project.Email].push(project);
          });
          setUserProjectMap(mapping);
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

    fetchProjects();
  }, []);

  // Filter projects
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

  const handleDelete1 = async (email) => {
    try {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbz_yCNQHXclDNnaUVLXqNZNBwjO0j19k6BJmXgHWRT7zIZb6de5bns42g1843YA2Kuu/exec"; // Project deletion
      const scriptUrl1 = "https://script.google.com/macros/s/AKfycbwgUfzLiByEBVkXkLQs52dNsyy9FRq4TmnTBbGExpzpYSI0vkIYYD7nLDiiTYVeoNDATQ/exec"; // Login deletion
  
      if (!email) {
        throw new Error("Email is required for deletion.");
      }
  
      const bodyDataProjects = `action=deleteAllProjectsByEmail&email=${encodeURIComponent(email)}`;
      const responseProjects = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyDataProjects
      });
  
      const projectResult = await responseProjects.json();
      if (!responseProjects.ok || projectResult.result !== 'success') {
        throw new Error(projectResult.error || 'Failed to delete project data');
      }
  
      const bodyDataLogin = `action=deleteLoginByEmail&email=${encodeURIComponent(email)}`;
      const responseLogin = await fetch(scriptUrl1, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyDataLogin
      });
  
      const loginResult = await responseLogin.json();
      if (!responseLogin.ok || loginResult.result !== 'success') {
        throw new Error(loginResult.error || 'Failed to delete login');
      }
  
      setProjects(prevProjects =>
        prevProjects.filter(p => p.Email !== email)
      );
  
      setUserProjectMap(prev => {
        const updated = { ...prev };
        delete updated[email];
        return updated;
      });
  
      alert(`Successfully deleted user and all their data'}`);
    } catch (err) {
      alert(`Error deleting : ${err.message}`);
      console.error('Delete error:', err);
    }
  };
  
  const handleDelete = async (type, email, projectTitle = null) => {
    try {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbx1RMehuYKVz9PZM3n6VtJnAo-Vcr73HVdSCXDPbWFEjc5q0zx8awhW5fNk-JGz0Zr7/exec";
      
      let bodyData;
      
      bodyData = `action=deleteProject&title=${encodeURIComponent(projectTitle)}&email=${encodeURIComponent(email)}`;

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
          setProjects(prevProjects => 
            prevProjects.filter(p => 
              !(p['Project Title'] === projectTitle && p.Email === email)
            )
          );
          
          setUserProjectMap(prev => {
            const updated = {...prev};
            if (updated[email]) {
              updated[email] = updated[email].filter(
                project => project['Project Title'] !== projectTitle
              );
              if (updated[email].length === 0) {
                delete updated[email];
              }
            }
            return updated;
          });
        
        alert(`Successfully deleted ${type === 'project' ? 'project' : 'user and all their projects'}`);
    } catch (err) {
      alert(`Error deleting ${type}: ${err.message}`);
      console.error('Delete error:', err);
    }
  };

  const handleExport = (type) => {
    if (type === 'projects') {
      if (filteredProjects.length === 0) {
        alert('No projects to export with current filters');
        return;
      }
      exportToExcel(filteredProjects, 'consultancy_projects');
    } else {
      const usersData = Object.keys(userProjectMap).map(email => ({
        Email: email,
        Projects: userProjectMap[email].map(p => p['Project Title']).join(', '),
        ProjectCount: userProjectMap[email].length
      }));
      
      if (usersData.length === 0) {
        alert('No users to export');
        return;
      }
      exportToExcel(usersData, 'consultancy_users');
    }
  };

  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleResetFilters = () => {
    setFilters({
      academicYear: '',
      amountThreshold: '',
      facultyName: '',
      industryName: '',
    });
  };

  const academicYears = [...new Set(projects.map(p => p['Academic Year']))].filter(Boolean);
  const industries = [...new Set(projects.map(p => p['Industry Name']))].filter(Boolean);

  const handleLogout = () => {
    navigate('/');
  };

  if (loading) return (
    <Box className="loading-container">
      <Typography variant="h6">Loading data...</Typography>
    </Box>
  );

  if (error) return (
    <Box className="error-container">
      <Typography variant="h6" color="error">Error: {error}</Typography>
      <Button variant="contained" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="xl" className="admin-container">
      <Box className="admin-header">
        <Typography variant="h4" className="admin-title">
          Admin Dashboard
        </Typography>
        <Box className="admin-actions">
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<DownloadIcon />}
            onClick={() => handleExport(selectedTab === 0 ? 'projects' : 'users')}
          >
            Export {selectedTab === 0 ? 'Projects' : 'Users'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filters
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Tabs 
        value={selectedTab} 
        onChange={(e, newValue) => setSelectedTab(newValue)}
        variant="fullWidth"
        className="admin-tabs"
      >
        <Tab 
          label={
            <Badge badgeContent={projects.length} color="primary">
              Projects
            </Badge>
          } 
        />
        <Tab 
          label={
            <Badge badgeContent={Object.keys(userProjectMap).length} color="primary">
              Users
            </Badge>
          } 
        />
      </Tabs>

      {selectedTab === 0 ? (
        <TableContainer component={Paper} className="admin-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Project Title</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Principal Investigator</TableCell>
                <TableCell>Amount (₹)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <TableRow key={`${project.Email}-${project['Project Title']}`}>
                    <TableCell>{project.Email}</TableCell>
                    <TableCell>{project['Project Title']}</TableCell>
                    <TableCell>{project['Industry Name']}</TableCell>
                    <TableCell>{project['Academic Year']}</TableCell>
                    <TableCell>{project['Principal Investigator']}</TableCell>
                    <TableCell>
                      {parseInt(project['Amount Sanctioned'] || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => navigate('/form', { 
                          state: { 
                            Email: project.Email, 
                            editMode: true, 
                            projectData: project,
                            adminMode: true 
                          } 
                        })}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => {
                          setItemToDelete({ type: 'project', email: project.Email, projectTitle: project['Project Title'] });
                          setDeleteDialogOpen(true);
                        }}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No projects found matching the current filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper} className="admin-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Projects</TableCell>
                <TableCell>Project Count</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(userProjectMap).length > 0 ? (
                Object.keys(userProjectMap).map(email => (
                  <TableRow key={email}>
                    <TableCell>{email}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {userProjectMap[email].map((project, index) => (
                          <Chip 
                            key={index} 
                            label={project['Project Title']} 
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {userProjectMap[email].length}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete User and All Projects">
                        <IconButton onClick={() => {
                          alert(email)
                          setItemToDelete({ type: 'user', email: email });
                          setDeleteDialogOpen(true);
                        }}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          {itemToDelete?.type === 'user' ? (
            <Typography>
              Are you sure you want to delete user <strong>{itemToDelete.email}</strong> and all their projects?
              This will remove {userProjectMap[itemToDelete.email]?.length || 0} projects and their login information.
            </Typography>
          ) : (
            <Typography>
              Are you sure you want to delete project <strong>{itemToDelete?.projectTitle}</strong> by {itemToDelete?.email}?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => 
            setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
              onClick={() => {
                if (itemToDelete.type === 'user') {
                  console.log(itemToDelete.email)
                  handleDelete1(itemToDelete.email);
                } else {
                  handleDelete(itemToDelete.type, itemToDelete.email, itemToDelete.projectTitle);
                }
                setDeleteDialogOpen(false);
              }} 
              color="error"
              variant="contained"
            >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Filter Options</Typography>
            <Button 
              startIcon={<RefreshIcon />}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal">
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={filters.academicYear}
              onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
              label="Academic Year"
            >
              <MenuItem value="">All Years</MenuItem>
              {academicYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Industry</InputLabel>
            <Select
              value={filters.industryName}
              onChange={(e) => setFilters({...filters, industryName: e.target.value})}
              label="Industry"
            >
              <MenuItem value="">All Industries</MenuItem>
              {industries.map(industry => (
                <MenuItem key={industry} value={industry}>{industry}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label="Faculty Name"
            value={filters.facultyName}
            onChange={(e) => setFilters({...filters, facultyName: e.target.value})}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Min Amount</InputLabel>
            <Select
              value={filters.amountThreshold}
              onChange={(e) => setFilters({...filters, amountThreshold: e.target.value})}
              label="Min Amount"
            >
              <MenuItem value="">Any Amount</MenuItem>
              <MenuItem value="50,000">₹50,000+</MenuItem>
              <MenuItem value="1,00,000">₹1,00,000+</MenuItem>
              <MenuItem value="2,00,000">₹2,00,000+</MenuItem>
              <MenuItem value="5,00,000">₹5,00,000+</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => setFilterDialogOpen(false)} 
            color="primary"
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;