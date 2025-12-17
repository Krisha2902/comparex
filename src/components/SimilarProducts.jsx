export default function SimilarProducts() {
  const products = [
    "iPhone 13",
    "iPhone 14 Plus",
    "Samsung Galaxy S23",
    "OnePlus 12",
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">
        Similar Products
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((item, i) => (
          <div
            key={i}
            className="min-w-[180px] bg-[#f5faff] border border-[#dbeafe] rounded-lg p-4 text-sm cursor-pointer hover:shadow-md transition"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
