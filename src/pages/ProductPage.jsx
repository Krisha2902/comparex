import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { searchProducts } from "../services/productService";
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


  //  ALERT STATES
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [targetPrice, setTargetPrice] = useState("");

  // Get first product image if available, else use placeholder
  const productImage =
    products.length > 0 && products[0].image
      ? products[0].image
      : PLACEHOLDER_IMAGE;

   // Fetch products when query changes
  useEffect(() => {
    if (!query) return;

    setLoading(true);
    setProducts([]); // Clear previous results

    searchProducts(query)
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Search Error:", err);
        setLoading(false);
        // data remains empty, UI will show "No products found" if logic allows
      });
  }, [query]);


  // Open alert modal for selected product
  //  Open Alert Modal
  const openAlertModal = (product) => {
    setSelectedProduct(product);
    setTargetPrice("");
    setShowAlertModal(true);
  };

  //  SAVE ALERT (FINAL & CORRECT)
  const saveAlert = async () => {
    try {
      await createAlert({
        productId: selectedProduct.productId,
        store: selectedProduct.store,
        currentPrice: selectedProduct.price,
        targetPrice: Number(targetPrice),
      });

      setShowAlertModal(false);
    } catch (error) {
      console.error("Failed to save alert", error);
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
          <p className="text-center text-gray-500 mt-6">
            Searching best prices...
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
          <div className="bg-white p-6 rounded-xl w-[320px]">
            <h3 className="text-lg font-semibold mb-3">
              Set Price Alert
            </h3>

            <p className="text-sm text-gray-600 mb-2">
              Notify me when price drops below
            </p>

            <input
              type="number"
              className="w-full border px-3 py-2 rounded-md mb-4"
              placeholder="Enter target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm bg-gray-200 rounded-md"
                onClick={() => setShowAlertModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md"
                onClick={saveAlert}
                disabled={!targetPrice}
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
