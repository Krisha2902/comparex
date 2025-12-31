import { Routes, Route, Navigate } from "react-router-dom";
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
import CategoryProducts from "./pages/CategoryProducts";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import ManageProducts from "./pages/ManageProducts";

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for storage changes to update login state
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (!isOnline) {
    return <NetworkLoader />;
  }

  return (
    <Routes>
      {/* Home page - accessible to everyone */}
      <Route path="/" element={<Home />} />

      {/* Public pages */}
      <Route path="/categories" element={<CategoryPage />} />
      <Route path="/categories/:slug" element={<CategoryProducts />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="/ask" element={<AskValueVue />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/deals" element={<SmartDeals />} />

      {/* Auth page - redirect to home if already logged in */}
      <Route 
        path="/auth" 
        element={isLoggedIn ? <Navigate to="/" replace /> : <LoginSignup onLogin={() => setIsLoggedIn(true)} />} 
      />

      {/* Protected routes - require login */}
      <Route 
        path="/wishlist" 
        element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        } />

      {/* Admin/Dashboard routes - accessible to all logged-in users */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute>
            <ManageProducts />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
