import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/valuevue-logo.jpg";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export default function Navbar({ onLoginClick }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for storage changes
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check on mount
    setIsLoggedIn(!!localStorage.getItem("token"));

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="bg-gradient-to-r from-[#cfeeff] to-[#b8ecff]">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* LEFT LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="valueVue" className="w-7 h-7" />
          <span className="text-lg font-bold text-blue-600">
            valueVue
          </span>
        </Link>

        {/* CENTER LINKS */}
        <ul className="flex gap-8 text-sm font-medium text-slate-800">
          <li>
            <Link to="/" className="hover:text-blue-600">Home</Link>
          </li>
          <li>
            <Link to="/categories" className="hover:text-blue-600">
              Categories
            </Link>
          </li>
          <li>
            <Link to="/wishlist" className="hover:text-blue-600">
            Wishlist
            </Link>
          </li>
          <li>
            <Link to="/ask" className="hover:text-blue-600">
            Ask ValueVue
            </Link>
          </li>
          <li>
            <Link to="/about" className="hover:text-blue-600">
            About Us
            </Link>
          </li>
          <li>
            <Link to="/deals" className="hover:text-blue-600">
            Smart Deals
            </Link>
          </li>
        </ul>

        {/* RIGHT LOGIN/LOGOUT */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={handleLogout}
                className="text-sm font-medium hover:text-blue-600"
              >
                Logout
              </button>
              <UserCircleIcon className="w-8 h-8 text-blue-600" />
            </>
          ) : (
            <>
              <Link 
                to="/auth" 
                className="text-sm font-medium hover:text-blue-600"
                onClick={onLoginClick}
              >
                Login / Signup
              </Link>
              <UserCircleIcon className="w-8 h-8 text-blue-600" />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
