import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Dashboard() {

  // ALERT STATE
  const [alerts, setAlerts] = useState([]);

  //  FETCH ALERTS (YAHI ADD KARNA THA)
  useEffect(() => {
    fetch("http://localhost:5000/api/alerts/user/123")
      .then((res) => res.json())
      .then((data) => setAlerts(data))
      .catch((err) => console.error("Alert fetch error:", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f9fd]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6 text-blue-600">
          Admin Dashboard
        </h1>

        {/* ADMIN ACTIONS */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
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

        {/*  PRICE ALERTS SECTION */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Price Alerts
          </h2>

          {alerts.length === 0 ? (
            <p className="text-gray-500">No price alerts found</p>
          ) : (
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">Product</th>
                  <th className="p-2">Store</th>
                  <th className="p-2">Target Price</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert._id} className="border-t">
                    <td className="p-2">
                      {alert.productName || "N/A"}
                    </td>
                    <td className="p-2">{alert.store}</td>
                    <td className="p-2">₹{alert.targetPrice}</td>
                    <td className="p-2">
                      {alert.isTriggered ? "Triggered" : "Active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
