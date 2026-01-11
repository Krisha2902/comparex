import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { initiateSearch, getSearchStatus } from "../services/productService";
import OptimizedImage from "../components/OptimizedImage";

function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Track in-flight search to prevent duplicates
  const searchInProgress = useRef(false);
  const lastSearchQuery = useRef("");
  const pollIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

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

    // Prevent duplicate searches (simple check)
    if (searchInProgress.current) {
      // If query is same, skip. If different, we might want to cancel previous?
      if (searchQuery === lastSearchQuery.current) return;
      // If different, we proceed (and maybe should cancel previous polling)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    // Mark search as in progress
    searchInProgress.current = true;
    lastSearchQuery.current = searchQuery;

    setLoading(true);
    setError("");
    setProducts([]);
    setStatusMsg("Starting search...");
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    try {
      console.log(`🔍 Searching for: "${searchQuery}"`);
      const jobId = await initiateSearch(searchQuery, "electronics");

      pollIntervalRef.current = setInterval(async () => {
        try {
          const data = await getSearchStatus(jobId);

          if (data.results && Array.isArray(data.results)) {
            setProducts(data.results);
          }

          if (data.status === "completed") {
            setLoading(false);
            setStatusMsg("");
            searchInProgress.current = false;
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          } else if (data.status === "failed") {
            setLoading(false);
            setError(data.error || "Search failed");
            searchInProgress.current = false;
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          } else {
            setStatusMsg(`Searching... Found ${data.results ? data.results.length : 0} products`);
          }
        } catch (err) {
          console.error("Polling error:", err);
          // Optional: stop on persistent error
        }
      }, 1500);

    } catch (err) {
      console.error("❌ Search error:", err);
      setError(err.message || "Failed to start search");
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
            <p className="text-blue-600 font-medium animate-pulse">{statusMsg || "Searching across Amazon, Flipkart, Croma, and Reliance..."}</p>
          </div>
        )}

        {/* Products Grid - Show if we have products, even if still loading */}
        {products.length > 0 && (
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

        {/* No Results - Only show if not loading and no products */}
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
