import React, { useState } from "react";
import { loginUser, registerUser } from "../api";
import loginVideo from "../assets/login-bg.mp4";
import logo from "../assets/logo.png";

function Login({ setToken }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // REGISTER FLOW
        if (!name.trim() || !email.trim() || !password.trim()) {
          setError("All fields are required");
          setLoading(false);
          return;
        }

        await registerUser({ name: name.trim(), email: email.trim(), password });
        alert("Registration successful! Please login.");
        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        // LOGIN FLOW
        if (!email.trim() || !password.trim()) {
          setError("Email and password are required");
          setLoading(false);
          return;
        }

        const response = await loginUser({ email: email.trim(), password });

        if (response?.message === "Login successful" && response?.token) {
          localStorage.setItem("token", response.token);
          setToken(response.token);
        } else {
          setError("Login failed");
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="position-relative vh-100 overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="position-absolute w-100 h-100"
        style={{ objectFit: "cover", zIndex: -2 }}
      >
        <source src={loginVideo} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div
        className="position-absolute w-100 h-100"
        style={{ background: "rgba(0, 0, 0, 0.65)", zIndex: -1 }}
      ></div>

      {/* Card */}
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div
          className="p-5 shadow-lg text-white"
          style={{
            width: "400px",
            borderRadius: "20px",
            backdropFilter: "blur(15px)",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255,255,255,0.2)"
          }}
        >
          <div className="text-center mb-4">
            <img src={logo} alt="logo" style={{ width: "100px" }} />
          </div>

          <h4 className="text-center mb-4">
            {isRegister ? "Create Account" : "Login to Dashboard"}
          </h4>

          {error && (
            <div className="alert alert-danger text-center py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {isRegister && (
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Register"
                : "Login"}
            </button>
          </form>

          <div className="text-center mt-3">
            <small>
              {isRegister ? "Already have an account?" : "Don't have an account?"}
            </small>
            <br />
            <button
              className="btn btn-link text-info"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
            >
              {isRegister ? "Login here" : "Register here"}
            </button>
          </div>

          <div className="text-center mt-4">
            <small style={{ opacity: 0.7 }}>
              © 2026 Audit Risk Management System
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
