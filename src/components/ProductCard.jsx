import { useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
      
      <div className="h-40 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>

      <h3 className="mt-3 text-sm font-medium text-slate-800">
        {product.name}
      </h3>

      <p className="text-blue-600 font-semibold mt-1">
        ₹{product.price}
      </p>

      <button
        onClick={() => navigate(`/product/${product.id}`)}
        className="mt-3 w-full text-sm py-1.5 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
      >
        Compare Prices
      </button>
    </div>
  );
}
