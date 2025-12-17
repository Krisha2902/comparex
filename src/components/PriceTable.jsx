export default function PriceTable() {
  const data = [
    { store: "Amazon", price: "₹79,999", status: "In Stock" },
    { store: "Flipkart", price: "₹78,499", status: "In Stock" },
    { store: "Croma", price: "₹80,990", status: "Out of Stock" },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">
        Price Comparison
      </h2>

      <table className="w-full text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="text-left py-2">Store</th>
            <th className="text-left py-2">Price</th>
            <th className="text-left py-2">Availability</th>
            <th></th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {data.map((item, i) => (
            <tr key={i}>
              <td className="py-3">{item.store}</td>
              <td className="py-3 font-medium">{item.price}</td>
              <td
                className={`py-3 ${
                  item.status === "In Stock"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {item.status}
              </td>
              <td className="py-3 text-right">
                <button className="text-blue-600 hover:underline">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
