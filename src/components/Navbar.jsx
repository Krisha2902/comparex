import { Link } from "react-router-dom";
import logo from "../assets/valuevue-logo.jpg";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export default function Navbar() {
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
          <li className="hover:text-blue-600 cursor-pointer">Wishlist</li>
          <li className="hover:text-blue-600 cursor-pointer">FAQ</li>
          <li className="hover:text-blue-600 cursor-pointer">About Us</li>
          <li className="hover:text-blue-600 cursor-pointer">Blog</li>
        </ul>

        {/* RIGHT LOGIN */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            Login / Signup
          </span>
          <UserCircleIcon className="w-8 h-8 text-blue-600" />
        </div>
      </nav>
    </div>
  );
}
