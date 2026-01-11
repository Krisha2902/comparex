import { useNavigate } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";

export default function RecommendationCard({ item }) {
  const navigate = useNavigate();

  // Handle both database products (with _id, title) and static products (with id, name)
  const productId = item._id || item.id;
  const productName = item.title || item.name;
  const productImage = item.image; // OptimizedImage handles fallback
  const productPrice = item.price;
  const productRating = item.rating;
  const productSource = item.source || "";

  // Don't render if missing required title and any of price/rating/reviews
  const missingAllMetrics = (productPrice === null || productPrice === undefined) && (productRating === null || productRating === undefined) && !item.reviews;
  if (!productName || missingAllMetrics) {
    return null;
  }

  return (
    <div
      className="
        w-[260px] shrink-0
        bg-white rounded-2xl
        shadow-md hover:shadow-lg transition
        p-4 flex flex-col
      "
    >
      {/* IMAGE */}
      <div className="h-[170px] flex items-center justify-center bg-gray-50 rounded-lg">
        <OptimizedImage
          src={productImage}
          alt={productName}
          className="w-full h-40 object-contain"
        />
      </div>
      {/* DETAILS */}
      <div className="mt-3 space-y-1 flex-grow">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {productName}
        </p>

        {productRating > 0 && (
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span>{productRating}</span>
            {item.reviews && <span>({item.reviews})</span>}
          </div>
        )}

        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-semibold text-black">
            {productPrice !== null && productPrice !== undefined ? (
              (() => {
                const raw = typeof productPrice === 'number' ? productPrice : Number(String(productPrice).replace(/[^0-9.-]+/g, ''));
                return Number.isFinite(raw) ? `₹${raw.toLocaleString('en-IN')}` : <span className="text-slate-400">-</span>;
              })()
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </span>
          {item.mrp && (
            <span className="text-xs text-gray-400 line-through">
              ₹{item.mrp}
            </span>
          )}
        </div>

        {productSource && (
          <p className="text-xs text-gray-500">
            {productSource}
          </p>
        )}

        {item.offer && (
          <p className="text-xs text-green-600 font-medium">
            {item.offer}
          </p>
        )}
      </div>

      {/* Compare Price Button */}
      <button
        onClick={() => navigate(`/compare?q=${encodeURIComponent(productName)}`)}
        className="mt-3 w-full text-sm py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
      >
        Compare Price
      </button>
    </div>
  );
}
