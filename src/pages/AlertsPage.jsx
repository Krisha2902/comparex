import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getUserAlerts, deleteAlert } from "../services/alertService";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const email = localStorage.getItem("userEmail");
            if (!email) {
                throw new Error("User email not found. Please login again.");
            }
            const data = await getUserAlerts(email);
            if (data.success) {
                setAlerts(data.alerts);
            } else {
                setError("Failed to load alerts");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this alert?")) return;
        try {
            await deleteAlert(id);
            setAlerts(alerts.filter(alert => alert._id !== id));
        } catch (err) {
            alert("Failed to delete alert: " + (err.message || "Unknown error"));
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-slate-50 py-10 px-4">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-800 mb-8">Manage Price Alerts</h1>

                    {loading ? (
                        <div className="text-center py-12">Loading alerts...</div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">{error}</div>
                    ) : alerts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <p className="text-slate-500">You don't have any price alerts yet.</p>
                            <p className="text-sm text-slate-400 mt-2">Search for a product and click "Set Alert" to get started!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {alerts.map((alert) => (
                                <div key={alert._id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-slate-800">{alert.productName}</h3>
                                        <div className="text-sm text-slate-500 mt-1 space-y-1">
                                            <p>Target Price: <span className="font-medium text-green-600">₹{alert.targetPrice}</span></p>
                                            <p>Current Price: {alert.currentPrice ? `₹${alert.currentPrice}` : 'Checking...'}</p>
                                            <p>Stores: {alert.stores.length > 0 ? alert.stores.join(", ") : "All Stores"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {alert.isTriggered && (
                                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                                Triggered
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(alert._id)}
                                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            Delete
                                        </button>
                                        <a
                                            href={alert.productUrl || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${!alert.productUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            View Product
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
