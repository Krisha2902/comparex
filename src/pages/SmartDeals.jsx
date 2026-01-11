import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import DealCard from "../components/DealCard";
import API_BASE_URL from "../config/api";

export default function SmartDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products from API - we'll show them as "deals"
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Convert products to deal format - only include those with valid prices
        const dealsData = (Array.isArray(data) ? data : [])
          .filter(product => {
            // Only include products with valid prices and titles
            const hasValidPrice = product.price !== null && product.price !== undefined && product.price !== '';
            const hasValidTitle = product.title && product.title.trim();
            return hasValidPrice && hasValidTitle;
          })
          .map((product, index) => ({
            id: product._id || index,
            title: product.title || "Product",
            price: product.price,
            originalPrice: product.originalPrice || product.price || 0,
            discount: product.discount || "0%",
            store: product.source || "Online",
            image: product.image
          }));
        setDeals(dealsData);
      })
      .catch((err) => {
        console.error("Error fetching deals:", err);
        setDeals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f9fd] to-[#eaf6ff]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-semibold text-blue-600 mb-6">
          Smart Deals & Insights
        </h1>

        {loading ? (
          <p className="text-gray-500 text-center py-12">Loading deals...</p>
        ) : deals.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No deals available right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
