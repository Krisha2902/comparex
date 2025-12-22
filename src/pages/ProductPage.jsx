import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PriceTable from "../components/PriceTable";
import PriceHistory from "../components/PriceHistory";
import SimilarProducts from "../components/SimilarProducts";

export default function ProductPage() {
  const [params] = useSearchParams();
  const query = params.get("query");

  // Temporary placeholder image (backend ke baad API se aayega)
  const productImage =
    "https://dummyimage.com/300x300/e6f2ff/1d4ed8&text=Product+Image";

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
            <img
              src={productImage}
              alt={query}
              className="w-[180px] h-[180px] object-contain"
            />
          </div>
        </div>

        {/* PRICE TABLE */}
        <PriceTable />

        {/* PRICE HISTORY */}
        <PriceHistory />

        {/* SIMILAR PRODUCTS */}
        <SimilarProducts />
      </div>
    </div>
  );
}
