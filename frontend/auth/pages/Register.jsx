import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SignUpButton } from '@clerk/react';
import "../auth.form.scss";

const Register = () => {
  const { user, loading, handleRegister } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const result = await handleRegister({ username, email, password });
    if (result?.success) {
      navigate("/");
    } else {
      setErrorMessage(result?.error || "Registration failed");
    }
  };

  if (loading) {
    return (
      <main>
        <div className="form-container" style={{ textAlign: "center", padding: "40px" }}>
          <h2>Loading...</h2>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="form-container">
        <h1>Register</h1>
        <p className="form-subtitle">Create an account to start crafting ATS-friendly resumes and custom interview plans.</p>

        {/* Clerk Sign Up Button */}
        <SignUpButton mode="modal">
          <button type="button" className="btn-clerk">
            <span>✨</span> Sign Up with Clerk
          </button>
        </SignUpButton>

        <div className="auth-divider">
          <span>or create standard account</span>
        </div>

        {errorMessage && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13.5px" }}>
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              value={username}
              placeholder="Enter your username"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={email}
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password (min. 8 characters)</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={password}
              minLength={8}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Register
          </button>
        </form>

        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </main>
  );
};

export default Register;