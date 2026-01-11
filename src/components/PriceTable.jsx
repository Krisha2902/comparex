export default function PriceTable({ products = [] }) {
  // Keep product if it has a price OR has rating/review count
  const validProducts = products.filter(p => {
    const hasPrice = p.price !== null && p.price !== undefined && p.price !== '';
    const hasRating = p.rating !== null && p.rating !== undefined && p.rating !== '';
    const hasReviews = p.reviews !== null && p.reviews !== undefined;
    return hasPrice || hasRating || hasReviews;
  });

  // Sort products: priced products first (ascending), unpriced at the end
  const toNumber = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(n) ? n : Infinity; // Infinity pushes unpriced items to the end
  };

  const sortedProducts = [...validProducts].sort((a, b) => {
    const priceA = toNumber(a.price);
    const priceB = toNumber(b.price);
    return priceA - priceB;
  });

  // Calculate actual minimum price for Best Deal badge
  const pricedProducts = sortedProducts.filter(p => toNumber(p.price) !== Infinity);
  const minPrice = pricedProducts.length > 0
    ? Math.min(...pricedProducts.map(p => toNumber(p.price)))
    : Infinity;

  // Helper to check if this item has the best deal
  const isBestDeal = (item) => {
    const itemPrice = toNumber(item.price);
    return itemPrice !== Infinity && itemPrice === minPrice;
  };

  if (!validProducts || validProducts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Price Comparison
        </h2>
        <p className="text-slate-500 text-center py-8">No products found. Search for a product to compare prices.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">
        Price Comparison ({validProducts.length} valid stores)
      </h2>

      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="text-left py-2">Store</th>
            <th className="text-left py-2">Price</th>
            <th className="text-left py-2">Rating</th>
            <th className="text-left py-2">Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {sortedProducts.map((item, i) => {
            const bestDeal = isBestDeal(item);
            const isAvailable = item.availability !== false; // Default to true if undefined

            return (
              <tr key={i} className={bestDeal ? "bg-green-50" : ""}>
                <td className="py-3 font-medium">{item.source || "Unknown Store"}</td>
                <td className={`py-3 font-medium ${bestDeal ? "text-green-600 text-lg" : ""}`}>
                  {item.price !== null && item.price !== undefined && item.price !== '' ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>
                          ₹{(typeof item.price === 'number' && Number.isFinite(item.price)) ? item.price.toLocaleString('en-IN') : (Number(String(item.price).replace(/[^0-9.-]+/g, ''))).toLocaleString('en-IN')}
                        </span>
                        {bestDeal && <span className="text-xs text-green-600 font-semibold bg-green-100 px-1.5 py-0.5 rounded">BEST DEAL</span>}
                      </div>

                      {/* Original Price / Discount */}
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span className="line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                          <span className="text-green-600 font-medium">
                            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3">
                  {item.rating !== null && item.rating !== undefined ? (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span>{item.rating}/5</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3">
                  {isAvailable ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">In Stock</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Out of Stock</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <a
                    href={item.productUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs font-medium"
                  >
                    Visit Store
                  </a>

                  <button
          style={{ marginLeft: "10px" }}
          onClick={() => openAlert(item)}
        >
           Set Alert
        </button>

                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
