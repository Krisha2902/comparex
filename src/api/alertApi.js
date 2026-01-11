import axios from "axios";

// Use environment variable for API URL with fallback for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const createAlert = (data) => {
  return axios.post(`${API_BASE_URL}/api/alerts/create`, data);
};
