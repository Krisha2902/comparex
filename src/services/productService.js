import axios from "axios";
import API_BASE_URL from "../config/api";

// Use environment variable for API URL with fallback for development
const API_Base = `${API_BASE_URL}/api/search`;

export const searchProducts = async (query, category = "electronics") => {
  try {
    // 1. Start Scraping Job
    console.log(`Starting scrape for: ${query}`);
    const startRes = await axios.post(`${API_Base}/scrape`, { query, category });
    const { jobId } = startRes.data;

    if (!jobId) throw new Error("Failed to start scraping job");

    console.log(`Job started: ${jobId}. Polling for results...`);

    // 2. Poll for status
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API_Base}/status/${jobId}`);
          const job = statusRes.data;

          console.log(`Job Status: ${job.status}`);

          if (job.status === "completed") {
            clearInterval(pollInterval);
            resolve(job.results || []);
          } else if (job.status === "failed") {
            clearInterval(pollInterval);
            reject(new Error(job.error || "Scraping failed"));
          }
          // If running or pending, continue polling naturally
        } catch (err) {
          clearInterval(pollInterval);
          reject(err);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 180 seconds (3 min) - allows for 4 scrapers with retry + slow networks
      setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error("Scraping timed out - Server took too long"));
      }, 180000);
    });

  } catch (error) {
    console.error("Search Service Error:", error);
    throw error;
  }
};

