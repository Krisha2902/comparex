import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import WishlistPage from "./pages/WishlistPage";
import AskValueVue from "./pages/AskValueVue";
import AboutUs from "./pages/AboutUs";
import SmartDeals from "./pages/SmartDeals";




export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/categories" element={<CategoryPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/ask" element={<AskValueVue />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/deals" element={<SmartDeals />} />
    </Routes>
  );
}
