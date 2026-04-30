// Use environment variable for API URL, fallback to localhost for development
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ============= REGISTER ================
export const registerUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
};

// ============= LOGIN ================
export const loginUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
};

// ============= VERIFY TOKEN ================
export const verifyToken = async (token) => {
  const response = await fetch(`${BASE_URL}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
};

// ---------------- CSV ANOMALY DETECTION ----------------
export const detectAnomalies = async (file) => {

  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/detect`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const getDetectionHistory = async () => {

  const token = localStorage.getItem("token");
  console.log("🔑 Token retrieved:", token ? `${token.substring(0, 20)}...` : "null");

  if (!token) {
    throw new Error("No authentication token found. Please login first.");
  }

  try {
    const response = await fetch(`${BASE_URL}/history`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("📡 History API response status:", response.status);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📦 History data received:", data);
    return data;
  } catch (error) {
    console.error("🚨 getDetectionHistory error:", error.message);
    throw error;
  }
};

export const getDetectionDetails = async (detectionId) => {

  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/detection/${detectionId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};