import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { searchProducts } from "../services/productService";
import OptimizedImage from "../components/OptimizedImage";

function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Track in-flight search to prevent duplicates
  const searchInProgress = useRef(false);
  const lastSearchQuery = useRef("");

  // Auto-search if query comes from URL
  useEffect(() => {
    if (initialQuery && initialQuery !== lastSearchQuery.current) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      setError("Please enter a product name");
      return;
    }

    // Prevent duplicate searches
    if (searchInProgress.current) {
      console.log("Search already in progress, skipping...");
      return;
    }

    // Mark search as in progress
    searchInProgress.current = true;
    lastSearchQuery.current = searchQuery;

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
      searchInProgress.current = false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return; // Prevent submit while loading
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p>{error}</p>
            </div>
            <button
              onClick={() => handleSearch()}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Try Again
            </button>
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
            {/* Filter and validate products - only show those with valid prices and titles */}
            {(() => {
              const validProducts = products.filter(p => {
                // Check if product has required fields
                const hasValidPrice = p.price !== null && p.price !== undefined && p.price !== '';
                const hasValidTitle = p.title && p.title.trim();
                const hasValidSource = p.source && p.source.trim();
                return hasValidPrice && hasValidTitle && hasValidSource;
              });

              if (validProducts.length === 0) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
                    No valid products found. Please try a different search.
                  </div>
                );
              }

              return (
                <>
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">
                    Found {validProducts.length} valid products {products.length > validProducts.length ? `(filtered from ${products.length})` : ''}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {validProducts.map((p, index) => (
                      <div
                        key={`${p.source}-${index}`}
                        className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition ${p.isBestDeal ? "ring-2 ring-green-500" : ""
                          }`}
                      >
                        {/* Best Deal Badge */}
                        {p.isBestDeal && (
                          <div className="mb-3">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                              🔥 Best Deal
                            </span>
                          </div>
                        )}

                        {/* Discount Badge */}
                        {p.discountPercent && p.discountPercent > 0 && (
                          <div className="mb-2">
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {p.discountPercent}% OFF
                            </span>
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
                          <OptimizedImage
                            src={p.image}
                            alt={p.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        {/* Product Info */}
                        <h3 className="text-sm font-medium text-slate-800 mb-2 line-clamp-2">
                          {p.title}
                        </h3>

                        {p.rating && p.rating > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-yellow-500 text-sm">★</span>
                            <span className="text-xs text-gray-600">{p.rating.toFixed(1)}/5</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{(p.price || 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Original Price Strikethrough */}
                        {p.originalPrice && p.originalPrice > p.price && (
                          <p className="text-sm text-gray-400 line-through mb-3">
                            ₹{(p.originalPrice || 0).toLocaleString('en-IN')}
                          </p>
                        )}

                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500">
                            Source: <span className="font-semibold text-gray-700">{p.source}</span>
                          </p>
                          {p.productUrl && (
                            <a
                              href={p.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-sm text-blue-600 hover:underline font-medium"
                            >
                              View on {p.source} →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
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
