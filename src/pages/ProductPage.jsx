import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { initiateSearch, getSearchStatus } from "../services/productService";
import { createAlert } from "../api/alertApi";
import Navbar from "../components/Navbar";
import PriceTable from "../components/PriceTable";
import PriceHistory from "../components/PriceHistory";
import SimilarProducts from "../components/SimilarProducts";
import OptimizedImage from "../components/OptimizedImage";

import { PLACEHOLDER_IMAGE } from "../constants";

export default function ProductPage() {
  const [params] = useSearchParams();
  const query = params.get("query");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  //  ALERT STATES
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [email, setEmail] = useState("");

  // Get first product image if available, else use placeholder
  const productImage =
    products.length > 0 && products[0].image
      ? products[0].image
      : PLACEHOLDER_IMAGE;

  // Search logic with streaming results
  useEffect(() => {
    if (!query) return;

    let pollInterval;
    let isMounted = true;

    const startSearch = async () => {
      setLoading(true);
      setProducts([]);
      setStatusMsg("Starting search...");

      try {
        const jobId = await initiateSearch(query);

        pollInterval = setInterval(async () => {
          if (!isMounted) return;
          try {
            const data = await getSearchStatus(jobId);

            if (data.results && data.results.length > 0) {
              setProducts(data.results);
            }

            if (data.status === "completed") {
              setLoading(false);
              setStatusMsg("");
              clearInterval(pollInterval);
            } else if (data.status === "failed") {
              setLoading(false);
              setStatusMsg("Search failed partially or completely.");
              clearInterval(pollInterval);
            } else {
              // Still running
              setStatusMsg(`Searching... Found ${data.results ? data.results.length : 0} products`);
            }
          } catch (err) {
            console.error("Polling error:", err);
            // Don't stop polling immediately on one network error, but maybe limit retries?
            // For now, let it continue or fail on repeated errors? 
            // Simple approach: stick to interval.
          }
        }, 1500); // Fast 1.5s updates

      } catch (err) {
        console.error("Search init error:", err);
        setLoading(false);
        setStatusMsg("Failed to start search");
      }
    };

    startSearch();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [query]);


  // Open alert modal for selected product
  //  Open Alert Modal
  const openAlertModal = (product) => {
    setSelectedProduct(product);
    setTargetPrice("");
    // If user is logged in (token exists), we might ideally decode it to get email, 
    // but for now let's leave email empty or pre-fill if we had user context.
    // Assuming simple behavior: always ask email if we don't have a robust user context provider yet.
    setEmail(localStorage.getItem("userEmail") || "");
    setShowAlertModal(true);
  };

  //  SAVE ALERT (FINAL & CORRECT)
  const saveAlert = async () => {
    if (!targetPrice || Number(targetPrice) <= 0) {
      alert("Please enter a valid target price.");
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      if (!selectedProduct) return;

      const alertData = {
        userEmail: email,
        productName: selectedProduct.title, // Map title correctly
        productUrl: selectedProduct.productUrl, // Pass URL for direct scraping optimization
        store: selectedProduct.source,
        targetPrice: Number(targetPrice),
        currentPrice: selectedProduct.price
      };

      await createAlert(alertData);

      alert("Price alert set successfully! We will notify you when the price drops.");
      setShowAlertModal(false);
    } catch (error) {
      console.error("Failed to save alert", error);
      const msg = error.response?.data?.message || "Failed to set price alert. Please try again.";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f9fd]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* PRODUCT HEADER */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6 flex items-center justify-between">

          {/* LEFT TEXT */}
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2 capitalize">
              {query}
            </h1>

            <p className="text-slate-600 mb-4">
              Compare prices across multiple platforms and find the best deal
              available.
            </p>

            {/* TAGS */}
            <div className="flex gap-2">
              <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                Best Prices
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600">
                Trusted Stores
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-600">
                Price History
              </span>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="w-[220px] h-[220px] bg-[#f1f7ff] rounded-xl flex items-center justify-center">
            <OptimizedImage
              src={productImage}
              alt={query}
              className="w-[180px] h-[180px] object-contain"
            />
          </div>
        </div>

        {loading && (
          <p className="text-center text-blue-600 mt-6 animate-pulse">
            {statusMsg || "Searching best prices..."}
          </p>
        )}

        {!loading && products.length === 0 && (
          <p className="text-center text-gray-500 mt-6">
            No products found for “{query}”
          </p>
        )}



        {/* PRICE TABLE */}
        <PriceTable products={products}
          onSetAlert={openAlertModal} />

        {/* PRICE HISTORY */}
        {!loading && products.length > 0 && <PriceHistory products={products} />}

        {/* SIMILAR PRODUCTS */}
        <SimilarProducts products={products} />


      </div>
      {/* ALERT MODAL */}{showAlertModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[320px] shadow-lg">
            <h3 className="text-lg font-semibold mb-3">
              Set Price Alert
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Notify me when <b>{selectedProduct?.source}</b> price drops below:
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Target Price (₹)</label>
                <input
                  type="number"
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 50000"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email Address</label>
                <input
                  type="email"
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                onClick={() => setShowAlertModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveAlert}
                disabled={!targetPrice || !email}
              >
                Save Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
