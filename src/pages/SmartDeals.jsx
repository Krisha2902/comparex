import Navbar from "../components/Navbar";
import DealCard from "../components/DealCard";
import { deals } from "../data/deals";

export default function SmartDeals() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f9fd] to-[#eaf6ff]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-semibold text-blue-600 mb-6">
          Smart Deals & Insights
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>

      </div>
    </div>
  );
}
