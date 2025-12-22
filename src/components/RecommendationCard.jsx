export default function RecommendationCard({ item }) {
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
      <div className="h-[170px] flex items-center justify-center">
        <img
        src={item.image}
        alt={item.name}
        className="w-full h-40 object-contain"
        referrerPolicy="no-referrer"
        />
      </div>
      {/* DETAILS */}
      <div className="mt-3 space-y-1">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {item.name}
        </p>

        <div className="text-xs text-gray-600">
          ⭐ {item.rating} ({item.reviews})
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-semibold text-black">
            ₹{item.price}
          </span>
          <span className="text-xs text-gray-400 line-through">
            ₹{item.mrp}
          </span>
        </div>

        <p className="text-xs text-green-600 font-medium">
          {item.offer}
        </p>
      </div>
    </div>
  );
}
