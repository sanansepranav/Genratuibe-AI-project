import React, { useState } from 'react';
import "../auth.form.scss";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
//import { useNavigate } from 'react-router-dom'; 

const Login = () => {
  const { loading, handleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const result = await handleLogin({ email, password });
    if (result?.success) {
      navigate("/");
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
        {errorMessage && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13.5px" }}>
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
            onChange={(e)=>{setEmail(e.target.value)}}
              type="email" 
              id="email" 
              name="email" 
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="Enter your password"
              onChange={(e)=>{setPassword(e.target.value)}}
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