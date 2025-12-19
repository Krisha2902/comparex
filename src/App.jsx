import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import WishlistPage from "./pages/WishlistPage";
import AskValueVue from "./pages/AskValueVue";
import AboutUs from "./pages/AboutUs";
import SmartDeals from "./pages/SmartDeals";
import LoginSignup from "./pages/LoginSignup";
import NetworkLoader from "./components/NetworkLoader";

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <NetworkLoader />;
  }
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/categories" element={<CategoryPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/ask" element={<AskValueVue />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/deals" element={<SmartDeals />} />
      <Route path="/auth" element={<LoginSignup />} />
    </Routes>
  );
}
