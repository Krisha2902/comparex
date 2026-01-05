import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { searchProducts } from "../services/productService";

function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-search if query comes from URL
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      setError("Please enter a product name");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      console.log(`🔍 Searching for: "${searchQuery}"`);
      const data = await searchProducts(searchQuery, "electronics");
      
      console.log(`📦 Received data:`, data);
      console.log(`📦 Data type:`, typeof data);
      console.log(`📦 Is array:`, Array.isArray(data));
      console.log(`📦 Data length:`, Array.isArray(data) ? data.length : 'N/A');
      
      // Check if data is an array (successful response)
      if (Array.isArray(data)) {
        console.log(`✅ Setting ${data.length} products`);
        setProducts(data);
        // Empty array is not an error - it's a valid result
        if (data.length === 0) {
          console.log(`⚠️ No products found for: "${searchQuery}"`);
          // Don't set error, just show the "no results" message
        } else {
          console.log(`✅ Products found:`, data.map(p => `${p.source}: ${p.title.substring(0, 40)}`));
        }
      } else {
        // Backend returned an error object
        console.error(`❌ Backend returned non-array:`, data);
        setError(data.message || "No products found. Try a different search term.");
        setProducts([]);
      }
    } catch (err) {
      console.error("❌ Search error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        request: err.request ? "Request made but no response" : "No request made"
      });
      
      // Handle different types of errors
      if (err.response) {
        // Backend returned an error response
        const errorMsg = err.response.data?.message || err.response.data?.error || "Failed to search products.";
        setError(errorMsg);
        console.error(`Backend error: ${errorMsg}`);
      } else if (err.request) {
        // Network error - backend not reachable
        const errorMsg = "Cannot connect to the server. Please make sure the backend server is running on port 5000.";
        setError(errorMsg);
        console.error(`Network error: ${errorMsg}`);
      } else {
        // Other errors
        const errorMsg = `Failed to search products: ${err.message}`;
        setError(errorMsg);
        console.error(`Other error: ${errorMsg}`);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-[#f3f9fd]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Price Comparison</h1>

        {/* Search Form */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              placeholder="Search product (e.g., iPhone 15, Samsung TV)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Searching across Amazon, Flipkart, Croma, and Reliance...</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Found {products.length} products
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p, index) => (
                <div
                  key={`${p.source}-${index}`}
                  className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition ${
                    index === 0 ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  {/* Best Deal Badge */}
                  {index === 0 && (
                    <div className="mb-3">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        🔥 Best Deal
                      </span>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/200";
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">No Image</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3 className="text-sm font-medium text-slate-800 mb-2 line-clamp-2">
                    {p.title}
                  </h3>

                  {p.rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="text-xs text-gray-600">{p.rating}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{p.price.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      Source: <span className="font-semibold text-gray-700">{p.source}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && products.length === 0 && query && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found. Try searching with a different term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComparePage;
