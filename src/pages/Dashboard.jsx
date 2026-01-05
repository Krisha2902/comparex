import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f3f9fd]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6 text-blue-600">Admin Dashboard</h1>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-slate-600 mb-6">
            Manage your products and view your dashboard.
          </p>
          <div className="flex gap-4">
            <Link 
              to="/admin/products" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Manage Products
            </Link>
            <Link 
              to="/" 
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
