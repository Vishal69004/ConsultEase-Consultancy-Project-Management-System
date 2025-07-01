import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setMessage('');
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch existing users from your doGet endpoint
      const checkResponse = await fetch('https://script.google.com/macros/s/AKfycbyRg7tvhOI4It7BEM7txzH2KIAGplQRCnyVXnvxTcDXg4hmqYjPlWA-hjEMiZveDt3_Jw/exec');
      const checkData = await checkResponse.json();
  
      if (checkData.result === 'success') {
        const users = checkData.data;
  
        // 2. Check if the email already exists
        const emailExists = users.some(user => user.Email.toLowerCase() === email.toLowerCase());
  
        if (emailExists) {
          setMessage('Email already registered. Please use a different one.');
          setLoading(false);
          return;
        }
      } else {
        setMessage('Error fetching existing users.');
        setLoading(false);
        return;
      }
      const response = await fetch('https://script.google.com/macros/s/AKfycbyRg7tvhOI4It7BEM7txzH2KIAGplQRCnyVXnvxTcDXg4hmqYjPlWA-hjEMiZveDt3_Jw/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ Email: email, Password: password }),
      });

      const data = await response.json();

      if (data.result === 'success') {
        setMessage('Registration Successful! Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setMessage('Registration Failed. Try again.');
      }
    } catch (error) {
      setMessage('Network error, please try again later.');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Register</h2>
          <p>Create your account</p>
        </div>
        {message && <div className="error-message">{message}</div>}
        <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
          <div className="form-group input-with-icon">
          <label htmlFor="email">Email Address</label>
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group input-with-icon">
          <label htmlFor="password">Password</label>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group input-with-icon">
          <label htmlFor="password">Confirm Password</label>
            <input
              type="password"
              placeholder="Enter Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          <div className="register-link">
            <p>Already have an account? <button onClick={() => navigate('/')}>Login</button></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;