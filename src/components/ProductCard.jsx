import { useNavigate } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  // Handle both database products (with _id, title) and static products (with id, name)
  const productId = product._id || product.id;
  const productName = product.title || product.name;
  const productImage = product.image; // OptimizedImage handles fallback
  const productPrice = product.price;
  const productRating = product.rating;

  // Don't render if missing required fields
  if (!productName || productPrice === null || productPrice === undefined) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">

      <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg">
        <OptimizedImage
          src={productImage}
          alt={productName}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <h3 className="mt-3 text-sm font-medium text-slate-800 line-clamp-2">
        {productName}
      </h3>

      {productRating > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-yellow-500 text-sm">★</span>
          <span className="text-xs text-gray-600">{productRating}</span>
        </div>
      )}

      {productPrice !== null && productPrice !== undefined && (
        <p className="text-blue-600 font-semibold mt-1">
          ₹{(typeof productPrice === 'number' ? productPrice : parseInt(productPrice)).toLocaleString('en-IN')}
        </p>
      )}

      {product.source && (
        <p className="text-xs text-gray-500 mt-1">
          {product.source}
        </p>
      )}

      <button
        onClick={() => navigate(`/compare?q=${encodeURIComponent(productName)}`)}
        className="mt-3 w-full text-sm py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
      >
        Compare Price
      </button>
    </div>
  );
}
