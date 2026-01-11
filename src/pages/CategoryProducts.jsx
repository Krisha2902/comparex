import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { categories } from "../data/categories";

export default function CategoryProducts() {
  const { slug } = useParams();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get category name from slug for display
  const category = categories.find((cat) => cat.slug === slug);
  const categoryName = category ? category.name : slug;

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/products/category/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setFilteredProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setFilteredProducts([]);
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#f3f9fd]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-600 capitalize">
            {categoryName} Products
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Loading..." : `Showing ${filteredProducts.length} results`}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* FILTERS */}
          <div className="col-span-3 bg-white rounded-xl p-4 shadow-sm h-fit">
            <h3 className="text-sm font-semibold text-blue-600 mb-3">
              Filters
            </h3>

            <p className="text-xs text-slate-500 mb-2">Category</p>
            <ul className="space-y-1 text-sm">
              <li className="cursor-pointer hover:text-blue-600">Tablets</li>
              <li className="cursor-pointer hover:text-blue-600">Mobiles</li>
              <li className="cursor-pointer hover:text-blue-600">Accessories</li>
            </ul>

            <p className="text-xs text-slate-500 mt-4 mb-2">Price</p>
            <ul className="space-y-1 text-sm">
              <li className="cursor-pointer hover:text-blue-600">Below ₹10,000</li>
              <li className="cursor-pointer hover:text-blue-600">₹10,000 – ₹30,000</li>
              <li className="cursor-pointer hover:text-blue-600">Above ₹30,000</li>
            </ul>
          </div>

          {/* PRODUCTS GRID */}
          <div className="col-span-9">
            {loading ? (
              <div className="bg-white rounded-xl p-8 text-center text-slate-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-slate-500">
                No products available in this category.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {filteredProducts
                  .filter(product => {
                    // Only show products with valid prices and titles
                    const hasValidPrice = product.price !== null && product.price !== undefined && product.price !== '';
                    const hasValidTitle = product.title && product.title.trim();
                    return hasValidPrice && hasValidTitle;
                  })
                  .map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))
                }
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
