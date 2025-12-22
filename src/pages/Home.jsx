import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import CategoryCard from "../components/CategoryCard";
import Recommendations from "../components/Recommendations";
import { categories } from "../data/categories";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#eaf7ff]">

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 mt-12 flex gap-10">

        {/* LEFT SIDE */}
        <div className="w-[55%] space-y-8">

          {/* SEARCH CARD */}
          <div
            className="bg-gradient-to-br from-blue-100 via-blue-50 to-white
            backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
          >
            <h1 className="text-3xl font-bold text-blue-600 leading-tight">
              Search product,<br />brand or category..
            </h1>

            <div className="mt-6">
              <SearchBar />
            </div>
          </div>

          {/* CATEGORIES CARD */}
          <div
            className="bg-gradient-to-br from-blue-100 via-blue-50 to-white
            backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
          >
            <h2 className="text-blue-600 font-semibold mb-4">
              Popular Categories
            </h2>

            <div className="grid grid-cols-3 gap-5">
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

        {/* RIGHT SIDE */}
        <div
          className="w-[45%] bg-gradient-to-br from-blue-100 via-blue-50 to-white
          backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
        >
          <h2 className="text-blue-600 font-semibold mb-4">
            Recommendations
          </h2>

          <Recommendations />
        </div>

      </div>
    </div>
  );
}
