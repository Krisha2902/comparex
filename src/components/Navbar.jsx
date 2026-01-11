import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import logo from "../assets/valuevue-logo.jpg";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { getNotifications } from "../services/alertService";

export default function Navbar({ onLoginClick }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
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

  // Fetch notifications
  useEffect(() => {
    if (isLoggedIn) {
      const email = localStorage.getItem("userEmail");
      if (email) {
        getNotifications(email)
          .then((data) => {
            if (data.success) {
              setNotifications(data.notifications || []);
            }
          })
          .catch((err) => console.error("Failed to fetch notifications:", err));
      }
    } else {
      setNotifications([]);
    }
  }, [isLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="bg-gradient-to-r from-[#cfeeff] to-[#b8ecff] relative z-50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LEFT LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="valueVue" className="w-7 h-7" />
          <span className="text-lg font-bold text-blue-600">valueVue</span>
        </Link>

        {/* CENTER LINKS */}
        <ul className="flex gap-8 text-sm font-medium text-slate-800 hidden md:flex">
          <li>
            <Link to="/" className="hover:text-blue-600">
              Home
            </Link>
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

        {/* RIGHT ACTION ICONS */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="p-1 rounded-full hover:bg-white/50 transition relative"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <BellIcon className="w-6 h-6 text-slate-700 hover:text-blue-600" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-600"></span>
                  )}
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-semibold text-sm text-slate-800">
                        Notifications
                      </h3>
                      <Link
                        to="/alerts"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => setShowDropdown(false)}
                      >
                        Manage Alerts
                      </Link>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition"
                          >
                            <p className="text-sm font-medium text-slate-800 line-clamp-1">
                              Price Drop: {notif.productName}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Now ₹{notif.currentPrice} (Target: ₹{notif.targetPrice})
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout & Profile */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium hover:text-blue-600"
                >
                  Logout
                </button>
                <UserCircleIcon className="w-8 h-8 text-blue-600" />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth"
                className="text-sm font-medium hover:text-blue-600"
                onClick={onLoginClick}
              >
                Login / Signup
              </Link>
              <UserCircleIcon className="w-8 h-8 text-blue-600" />
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
