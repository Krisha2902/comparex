import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="flex gap-4">
        <Link to="/admin/products" className="bg-blue-600 text-white px-4 py-2 rounded">
          Manage Products
        </Link>
      </div>
    </div>
  );
}
