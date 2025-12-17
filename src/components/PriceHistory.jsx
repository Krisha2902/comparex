export default function PriceHistory() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">
        Price History
      </h2>

      {/* Dummy chart */}
      <div className="h-40 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-slate-500">
        Price trend graph (Dummy)
      </div>
    </div>
  );
}
