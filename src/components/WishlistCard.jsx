import OptimizedImage from "./OptimizedImage";

export default function WishlistCard({ item }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col">
      {/* Image */}
      <div className="w-full h-40 bg-[#f5faff] rounded-lg flex items-center justify-center mb-4">
        <OptimizedImage
          src={item.image}
          alt={item.name}
          className="h-32 object-contain"
        />
      </div>

      {/* Info */}
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        {item.name}
      </h3>

      <p className="text-xs text-slate-500">
        Available on {item.store}
      </p>

      <p className="text-blue-600 font-semibold mt-2">
        {item.price}
      </p>

      {/* Actions */}
      <div className="flex justify-between mt-auto pt-4 text-sm">
        <button className="text-blue-600 hover:underline">
          View Comparison
        </button>
        <button className="text-red-500 hover:underline">
          Remove
        </button>
      </div>
    </div>
  );
}
