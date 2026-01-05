import axios from "axios";

export const searchProducts = async (query, category) => {
  try {
    const url = `http://localhost:5000/api/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
    console.log(`🌐 API Call: ${url}`);
    console.log(`⏳ Waiting for response...`);
    
    const res = await axios.get(url, {
      timeout: 90000, // 90 seconds timeout for scraping (scraping takes time)
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        // Accept any status code < 500
        return status < 500;
      }
    });
    
    console.log(`✅ API Response received!`);
    console.log(`✅ Status: ${res.status}`);
    console.log(`✅ Data type: ${Array.isArray(res.data) ? 'Array' : typeof res.data}`);
    console.log(`✅ Data length: ${Array.isArray(res.data) ? res.data.length : 'N/A'}`);
    
    if (res.status >= 400) {
      console.error(`❌ API returned error status ${res.status}:`, res.data);
      throw new Error(res.data?.message || `API returned status ${res.status}`);
    }
    
    if (!Array.isArray(res.data)) {
      console.error(`❌ API returned non-array data:`, res.data);
      throw new Error('API returned invalid data format');
    }
    
    console.log(`✅ Returning ${res.data.length} products`);
    if (res.data.length > 0) {
      console.log(`📦 Products:`, res.data.map(p => `  - ${p.source}: ${p.title?.substring(0, 50)}`));
    }
    
    return res.data;
  } catch (error) {
    console.error("❌ API Error Details:");
    console.error("  Error message:", error.message);
    console.error("  Error code:", error.code);
    
    if (error.response) {
      console.error("  Response status:", error.response.status);
      console.error("  Response data:", error.response.data);
    } else if (error.request) {
      console.error("  No response received - Server might be down or request timed out");
      console.error("  Request details:", error.request);
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - Scraping is taking too long. Please try again.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Make sure backend is running on port 5000.');
    }
    
    throw error;
  }
};
