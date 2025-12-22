import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import CategoryCard from "../components/CategoryCard";
import { categories } from "../data/categories";

export default function CategoryPage() {
  const subcategories = [
  "Mobiles",
  "Laptops",
  "TVs",
  "Cameras",
  "Tablets",
  "Headphones",
  "Wearables",
  "Accessories",
];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f9fd] to-[#eaf6ff]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* PAGE TITLE */}
        <h1 className="text-2xl font-semibold text-blue-600 mb-6">
          Browse Categories
        </h1>

        {/* SEARCH + TOP SUBCATEGORIES */}
        <div className="grid grid-cols-12 gap-6 mb-8">

          {/* SEARCH BAR */}
          <div className="col-span-6">
            <SearchBar />
          </div>

          {/* TOP SUBCATEGORIES */}
          <div className="col-span-4 bg-white rounded-xl p-4 shadow-sm h-[120px]">
            <h3 className="text-sm font-semibold text-blue-600 mb-2">
              Top Subcategories
            </h3>

            <ul className="text-sm space-y-1">
  {subcategories.slice(0, 3).map((item) => (
    <li
      key={item}
      className="
        text-slate-700
        cursor-pointer
        transition-colors
        duration-200
        hover:text-blue-600
      "
    >
      {item}
    </li>
  ))}
</ul>

          </div>

        </div>

        {/* FILTERS + CATEGORY GRID */}
        <div className="grid grid-cols-12 gap-6">

          {/* FILTERS */}
          <div className="col-span-3 bg-white rounded-xl p-4 shadow-sm h-[270px]">

            {/* Filters = BLUE */}
            <h3 className="text-sm font-semibold text-blue-600 mb-3">
              Filters
            </h3>

            {/* Category = GREY */}
            <p className="text-xs font-medium text-slate-500 mb-2">
              Category
            </p>

            {/* Filter items = BLACK */}
            <ul className="text-sm space-y-1">
  {subcategories.map((item) => (
    <li
      key={item}
      className="
        text-black
        cursor-pointer
        transition-colors
        duration-200
        hover:text-blue-600
      "
    >
      {item}
    </li>
  ))}
</ul>

          </div>

          {/* CATEGORY GRID */}
          <div className="col-span-9 grid grid-cols-3 gap-4">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                name={cat.name}
                icon={cat.icon}
                slug={cat.slug}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
