export default function CategoryFilters() {
  const subcategories = ["Mobiles", "Laptops", "TVs", "Cameras"];

  return (
    <div className="bg-white rounded-2xl p-4 shadow space-y-4">

      <h3 className="font-semibold text-sm text-gray-700">
        Filters
      </h3>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">
          Category
        </p>

        <ul className="space-y-1 text-sm">
          {subcategories.map((item) => (
            <li
              key={item}
              className="cursor-pointer hover:text-blue-500"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-medium text-gray-500 mb-2">
          Top Subcategories
        </p>

        <ul className="space-y-1 text-sm">
          {subcategories.slice(0, 3).map((item) => (
            <li
              key={item}
              className="cursor-pointer hover:text-blue-500"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
