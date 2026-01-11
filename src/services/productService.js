
import axios from "axios";
import API_BASE_URL from "../config/api";

// Use environment variable for API URL with fallback for development
const API_Base = `${API_BASE_URL}/api/search`;

export const initiateSearch = async (query, category = "electronics") => {
  try {
    console.log(`Starting scrape for: ${query}`);
    const res = await axios.post(`${API_Base}/scrape`, { query, category });
    if (!res.data.jobId) throw new Error("Failed to start scraping job");
    return res.data.jobId;
  } catch (error) {
    console.error("Initiate Search Error:", error);
    if (error.response) {
      // Server responded with a status other than 2xx
      const msg = error.response.data?.message || `Server error: ${error.response.status}`;
      throw new Error(msg);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error("Network error: No response from server. Please check your connection.");
    } else {
      // Something happened in setting up the request
      throw error;
    }
  }
};

export const getSearchStatus = async (jobId) => {
  try {
    const res = await axios.get(`${API_Base}/status/${jobId}`);
    return res.data;
  } catch (error) {
    console.error("Get Status Error:", error);
    if (error.response) {
      const msg = error.response.data?.message || `Server error: ${error.response.status}`;
      throw new Error(msg);
    } else if (error.request) {
      throw new Error("Network error: Unable to fetch search status.");
    } else {
      throw error;
    }
  }
};


