import React, { useState } from 'react';
import './ConsultancyForm.css';
import { useLocation, useNavigate } from 'react-router-dom';

const ConsultancyForm = () => 
{
  const location = useLocation();
  const { Email, editMode, projectData, adminMode} = location.state || {};
  const navigate = useNavigate();
  const [formData, setFormData] = useState(
    editMode && projectData ? 
        {
            "Industry Name": projectData['Industry Name'] || '',
            "Duration": projectData['Duration'] || '',
            "Project Title": projectData['Project Title'] || '',
            "Academic Year": projectData['Academic Year'] || '',
            "Principal Investigator": projectData['Principal Investigator'] || '',
            "Co-Principal Investigator": projectData['Co-Principal Investigator'] || '',
            "Amount Sanctioned": projectData['Amount Sanctioned'] || '',
            "Amount Received": projectData['Amount Received'] || '',
            "Bill Settlement Details": projectData['Bill Settlement Details'] || '',
            "Bill Upload": projectData['Bill Upload'] ? { name: projectData['Bill Upload'] } : null,
            "Signed Agreement Upload": projectData['Signed Agreement Upload'] ? { name: projectData['Signed Agreement Upload'] } : null,
            "Student Details": projectData['Student Details'] || '',
            "Project Summary": projectData['Project Summary'] || '',
            "id": projectData['id'] || '' 
        } :
    {
    "Industry Name": '',
    "Duration": '',
    "Project Title": '',
    "Academic Year": '',
    "Deadline": '',
    "Principal Investigator": '',
    "Co-Principal Investigator": '',
    "Amount Sanctioned": '',
    "Amount Received": '',
    "Bill Settlement Details": '',
    "Bill Upload": null,
    "Signed Agreement Upload": null,
    "Student Details": '',
    "Project Summary": ''
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'file' ? files[0] : 
              value
    }));
    
};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const uploadFile = async (file, key) => 
    {
    const formPayload = new FormData();
    const fileExtension = file.name.split('.').pop();
    const renamedFileName = `${Email}-${formData['Project Title']}-${key}.${fileExtension}`;
    const renamedFile = new File([file], renamedFileName, { type: file.type });
    return new Promise((resolve, reject) => {
      if (!file) {
        reject("No file provided");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
  
        formPayload.append('action', "uploadFileToDrive");
        formPayload.append('fileName', renamedFileName);
        formPayload.append('mimeType', file.type);
        formPayload.append('data', base64Data);

        try {
          const response = await fetch("https://script.google.com/macros/s/AKfycbzXdgqRypNxRPE-BXH8kSkgiYdH-IoWOhFMkk2rwVSWFwg7sD78HcTMMwmYKTV5TEfp/exec", {
            method: "POST",
            body: formPayload,
          });
  
          const result = await response.json();
          if (result.status) {
            resolve(result.url);
          } else {
            reject(result.error || "Upload failed");
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject("File reading failed");
      reader.readAsDataURL(file);
    });
  };

  const goBack = () =>
  {
    if(adminMode === true)
    {
      navigate("/admin");
    }
    else
    {
      navigate("/dashboard", {state: {email: Email}});
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try 
    {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbzXdgqRypNxRPE-BXH8kSkgiYdH-IoWOhFMkk2rwVSWFwg7sD78HcTMMwmYKTV5TEfp/exec";
      if (!editMode) 
      {
        const checkUrl = `${scriptUrl}?action=getProjectById&email=${encodeURIComponent(Email)}&title=${encodeURIComponent(formData['Project Title'])}`;
        const checkResponse = await fetch(checkUrl);
        const checkResult = await checkResponse.json();
  
        if (checkResult.result === 'success') {
          alert("A project with this title already exists for the given email.");
          setIsSubmitting(false);
          return;
        }
      }
      const formPayload = new FormData();
      formPayload.append('Email', Email);
      if (editMode) {
        formPayload.append('title', formData['Project Title']);
        formPayload.append('action', 'updateProject');
    }

    else {
        formPayload.append('action', 'createProject');
    }
      for (const key in formData) 
      {
        if (key === 'Bill Upload' || key === 'Signed Agreement Upload') 
          {
          if (formData[key] instanceof File || formData[key] instanceof Blob) 
            {
            const url = await uploadFile(formData[key], key);
            formPayload.append(key, url);
          } 
          else if(editMode) 
          {
            formPayload.append(key, formData[key].name);
          }
        } 
        else 
        {
          formPayload.append(key, formData[key]);
        }
      }
  
      const response = await fetch(scriptUrl, { 
        method: 'POST', 
        body: formPayload,
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
      const result = await response.json();
      if (result.result !== 'success') throw new Error(result.error || 'Unknown error');
      
      setSubmitStatus({ success: true, message: 'Data submitted successfully!' });
      alert("Form submitted Successfully!!!!");
      if(adminMode === true)
      {
        navigate("/admin");
      }
      else
      {
        navigate("/dashboard", {state: {email: Email}});
      }
      setFormData({
        "Industry Name": '',
        "Duration": '',
        "Project Title": '',
        "Academic Year": '',
        "Deadline": '',
        "Principal Investigator": '',
        "Co-Principal Investigator": '',
        "Amount Sanctioned": '',
        "Amount Received": '',
        "Bill Settlement Details": '',
        "Bill Upload": null,
        "Signed Agreement Upload": null,
        "Student Details": '',
        "Project Summary": ''
      });
  
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({ success: false, message: 'Error submitting data. Please try again.' });
      alert("Error submitting form: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="consultancy-container">
      <h1 className="form-header">Consultancy Project Management</h1>
      
      <form onSubmit={handleSubmit} className="consultancy-form">
        <div className="form-section">
          <h2 className="section-title">Project Details</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="industryName">Industry Name</label>
              <input
                type="text"
                id="industryName"
                name="Industry Name"
                value={formData['Industry Name']}
                onChange={handleChange}
                placeholder="Enter industry name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="projectDuration">Duration</label>
              <input
                type="text"
                id="projectDuration"
                name="Duration"
                value={formData['Duration']}
                onChange={handleChange}
                placeholder="e.g. 6 months"
                required
              />
            </div>
          </div>

          <div className="form-row">
          <div className="form-group">
            <label htmlFor="projectDeadline">Project Deadline</label>
            <input
              type="date"
              id="projectDeadline"
              name="Deadline"
              value={formData['Deadline']}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

          <div className="divider"></div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="projectTitle" className="bold-label">Project Title</label>
              <input
                type="text"
                id="projectTitle"
                name="Project Title"
                value={formData['Project Title']}
                onChange={handleChange}
                placeholder="Enter project title"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="academicYear">Academic Year</label>
              <input
                type="text"
                id="academicYear"
                name="Academic Year"
                value={formData['Academic Year']}
                onChange={handleChange}
                placeholder="e.g. 2023-2024"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Investigators</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="principalInvestigator">Principal Investigator</label>
              <input
                type="text"
                id="principalInvestigator"
                name="Principal Investigator"
                value={formData['Principal Investigator']}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="coPrincipalInvestigator">Co-Principal Investigator</label>
              <input
                type="text"
                id="coPrincipalInvestigator"
                name="Co-Principal Investigator"
                value={formData['Co-Principal Investigator']}
                onChange={handleChange}
                placeholder="Full name (optional)"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Financial Details</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amountSanctioned">Amount Sanctioned (₹)</label>
              <input
                type="number"
                id="amountSanctioned"
                name="Amount Sanctioned"
                value={formData['Amount Sanctioned']}
                onChange={handleChange}
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="amountReceived">Amount Received (₹)</label>
              <input
                type="number"
                id="amountReceived"
                name="Amount Received"
                value={formData['Amount Received']}
                onChange={handleChange}
                placeholder="Enter amount"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Documentation</h2>
          
          <div className="form-group">
            <label htmlFor="billSettlementDetails">Bill Settlement Details</label>
            <textarea
              id="billSettlementDetails"
              name="Bill Settlement Details"
              value={formData['Bill Settlement Details']}
              onChange={handleChange}
              rows="3"
              placeholder="Enter details"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="billProof">Upload Bill Proof</label>
              <input
                type="file"
                id="billProof"
                name="Bill Upload"
                onChange={handleChange}
                accept=".pdf"
                required={!editMode}
              />
            </div>
            {editMode ? (
                formData['Bill Upload'] && (
                  <div className="file-info">
                    Selected file: <a href={formData['Bill Upload'].name} target="_blank" rel="noopener noreferrer">View</a>
                  </div>
                )
              ) : (
                formData['Bill Upload'] && (
                  <div className="file-info">
                    Selected file: {formData['Bill Upload'].name}
                  </div>
                )
              )
            }
            <div className="form-group">
              <label htmlFor="agreementDocument">Upload Signed Agreement</label>
              <input
                type="file"
                id="agreementDocument"
                name="Signed Agreement Upload"
                onChange={handleChange}
                accept=".pdf"
                required={!editMode}
              />
            </div>
            {editMode ? (
              formData['Signed Agreement Upload'] && (
                <div className="file-info">
                  Selected file: <a href={formData['Signed Agreement Upload'].name} target="_blank" rel="noopener noreferrer">View</a>
                </div>
              )
            ) : (
              formData['Signed Agreement Upload'] && (
                <div className="file-info">
                  Selected file: {formData['Signed Agreement Upload'].name}
                </div>
              )
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentDetails">Student Details</label>
              <textarea
                id="studentDetails"
                name="Student Details"
                value={formData['Student Details']}
                onChange={handleChange}
                rows="4"
                placeholder="List student names, IDs, and roles"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="projectSummary">Project Summary (100 words max)</label>
              <textarea
                id="projectSummary"
                name="Project Summary"
                value={formData['Project Summary']}
                onChange={handleChange}
                rows="4"
                maxLength="1000"
                placeholder="Brief project description"
                required
              />
              <div className="word-count">{formData['Project Summary'].length}/1000 characters</div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={goBack}>
            Back
          </button>
          <button type="submit" className="primary-button">
            Submit Project
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultancyForm;