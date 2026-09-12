import React, { useState, useEffect } from 'react';
import "../auth.form.scss";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SignInButton } from '@clerk/react';

const Login = () => {
  const { user, loading, handleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      if (user.role === "admin" || user.username === "admin" || email === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const result = await handleLogin({ email, password });
    if (result?.success) {
      if (result.user?.role === "admin" || result.user?.username === "admin" || email === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      setErrorMessage(result?.error || "Login failed");
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
        <h1>Login</h1>
        <p className="form-subtitle">Welcome back! Sign in to access your interview plans and resumes.</p>

        {/* Clerk Sign In Button */}
        <SignInButton mode="modal">
          <button type="button" className="btn-clerk">
            <span>🔐</span> Continue with Clerk
          </button>
        </SignInButton>

        <div className="auth-divider">
          <span>or sign in with credentials</span>
        </div>

        {errorMessage && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13.5px" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email or Username</label>
            <input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="text" 
              id="email" 
              name="email" 
              placeholder="Enter your email or username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>

        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </main>
  );
};

export default Login;