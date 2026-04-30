import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { verifyToken } from "./api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    const storedToken = localStorage.getItem("token");
    
    if (!storedToken) {
      setIsVerifying(false);
      setToken(null);
      return;
    }

    try {
      console.log("🔐 Verifying token on app load...");
      await verifyToken(storedToken);
      console.log("✅ Token verified successfully");
      setToken(storedToken);
      setIsVerifying(false);
    } catch (error) {
      console.warn("⚠️ Token validation failed:", error.message);
      // Token is invalid, clear it and show login
      localStorage.removeItem("token");
      setToken(null);
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return <Dashboard setToken={setToken} />;
}

export default App;
