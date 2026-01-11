export default function PriceHistory({ products = [] }) {
  // Render a simple sparkline when numeric price points exist.
  const prices = (products || [])
    .map(p => {
      if (typeof p.price === 'number' && Number.isFinite(p.price)) return p.price;
      const n = Number(String(p.price || '').replace(/[^0-9.-]+/g, ''));
      return Number.isFinite(n) ? n : null;
    })
    .filter(v => v !== null);

  const hasEnoughPoints = prices.length >= 2;

  if (!hasEnoughPoints) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Price History
        </h2>

        <div className="h-40 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center text-slate-600">
          <div className="text-center">
            <p className="font-medium">Price history tracking</p>
            <p className="text-xs text-slate-500 mt-2">Historical price data will be available soon</p>
          </div>
        </div>
      </div>
    );
  }

  const w = 300;
  const h = 80;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">
        Price History
      </h2>

      <div className="h-40 rounded-lg flex items-center justify-center text-slate-600">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md">
          <polyline fill="none" stroke="#60A5FA" strokeWidth="2" points={points} />
          {prices.map((p, i) => {
            const x = (i / (prices.length - 1)) * w;
            const y = h - ((p - min) / range) * h;
            return <circle key={i} cx={x} cy={y} r={3} fill="#2563EB" />;
          })}
        </svg>
      </div>
    </div>
  );
}
