import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PriceTable from "../components/PriceTable";
import PriceHistory from "../components/PriceHistory";
import SimilarProducts from "../components/SimilarProducts";

export default function ProductPage() {
  const [params] = useSearchParams();
  const query = params.get("query");

  return (
    <div className="min-h-screen bg-[#f3f9fd]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* PRODUCT HEADER */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">
            {query}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare prices across multiple platforms
          </p>
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
