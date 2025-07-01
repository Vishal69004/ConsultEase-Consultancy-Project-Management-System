import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

      // First check for admin login (before making API call)
      try {
        // Admin login check - modified to use admin@gmail.com as requested
        if (email === 'admin@gmail.com') {
          toast.success("Admin login successful", {
            position: "top-right",
            autoClose: 2000,
            onClose: () => navigate("/admin", { state: { isAdmin: true } }) // Pass admin status
          });
          return;
        }

      // Regular user login flow
      const response = await fetch('https://script.google.com/macros/s/AKfycbyRg7tvhOI4It7BEM7txzH2KIAGplQRCnyVXnvxTcDXg4hmqYjPlWA-hjEMiZveDt3_Jw/exec');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result === 'success') {
        const users = data.data;
        const user = users.find(user => user.Email === email && user.Password === password);
        
        if (user) {
          toast.success("Login Successful", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            onClose: () => navigate("/dashboard", {state: {email}})
          });
        } else {
          throw new Error("Invalid email or password");
        }
      } else {
        throw new Error(data.error || "Error fetching user data");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      toast.error(error.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Please enter your credentials to login</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <span className="input-icon">
                <ion-icon name="mail-outline"></ion-icon>
              </span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <span className="input-icon">
                <ion-icon name="lock-closed-outline"></ion-icon>
              </span>
            </div>
          </div>
          
          <div className="login-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="register-link">
          Don't have an account? <button type="button" onClick={() => navigate('/register')}>Register here</button>
        </div>

      </div>
    </div>
  );
};

export default Login;