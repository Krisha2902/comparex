export default function DealCard({ deal }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow hover:shadow-md transition">
      <span className="text-xs text-green-600 font-semibold">
        {deal.discount}
      </span>

      <h3 className="font-semibold mt-2">{deal.title}</h3>

      <p className="text-blue-600 font-bold">{deal.price}</p>

      <p className="text-xs text-slate-500">Available on {deal.store}</p>
    </div>
  );
}
