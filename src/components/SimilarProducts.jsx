import { useNavigate } from "react-router-dom";

export default function SimilarProducts({ products = [] }) {
  const navigate = useNavigate();

  // Filter products with valid prices and get first 5
  const validProducts = products.filter(p => 
    p.price !== null && p.price !== undefined && p.price !== ''
  );
  const suggestions = validProducts.slice(0, 5);

  if (!validProducts || validProducts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Similar Products
        </h2>
        <p className="text-slate-500 text-center py-6">No similar products available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">
        Other Options ({suggestions.length})
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {suggestions.map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(`/compare?q=${encodeURIComponent(item.title || item.name)}`)}
            className="min-w-[200px] bg-white border border-[#dbeafe] rounded-lg p-4 cursor-pointer hover:shadow-lg transition"
          >
            <p className="text-xs font-medium text-blue-600 mb-2">{item.source || "Online"}</p>
            <p className="text-sm font-medium line-clamp-2">{item.title || item.name}</p>
            <p className="text-blue-600 font-bold mt-2">₹{typeof item.price === 'number' ? item.price.toLocaleString('en-IN') : item.price}</p>
            {item.rating && (
              <p className="text-xs text-gray-500 mt-1">⭐ {item.rating}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
