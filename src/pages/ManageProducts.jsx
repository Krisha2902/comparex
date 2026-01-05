import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { categories } from "../data/categories";
import Navbar from "../components/Navbar";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [source, setSource] = useState("");
  const [image, setImage] = useState("");
  const [rating, setRating] = useState("");
  const [category, setCategory] = useState("");

  const [token, setToken] = useState(localStorage.getItem("token"));

  // Update token when storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fetchProducts = async () => {
    try {
      // GET is public, no auth needed
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      let errorMessage = "Failed to load products";
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || !error.response) {
        errorMessage = "Cannot connect to server. Please make sure:\n1. Backend server is running on http://localhost:5000\n2. MongoDB is connected\n3. Check console for errors";
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
      }
      
      alert(errorMessage);
      setProducts([]); // Set empty array on error
    }
  };

  useEffect(() => { 
    fetchProducts(); 
    setToken(localStorage.getItem("token"));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    
    if (!token) {
      alert("Please login first to add products!");
      return;
    }

    if (!title || !price || !image || !rating || !category) {
      alert("Please fill all required fields: Title, Price, Image, Rating, and Category");
      return;
    }
    
    try {
      const productData = {
        title: title.trim(),
        price: parseFloat(price),
        image: image.trim(),
        rating: parseFloat(rating),
        category: category.trim(),
      };
      
      // Add source only if provided
      if (source && source.trim()) {
        productData.source = source.trim();
      }

      const res = await axios.post(
        "http://localhost:5000/api/products",
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data) {
        alert("Product added successfully!");
        setTitle(""); setPrice(""); setSource(""); setImage(""); setRating(""); setCategory("");
        fetchProducts();
      }
    } catch (error) {
      console.error("Error adding product:", error);
      let errorMessage = "Failed to add product. Please check all fields.";
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = "Authentication failed. Please login again.";
          localStorage.removeItem("token");
        } else {
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        errorMessage;
        }
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = "Cannot connect to server. Please make sure the backend server is running on http://localhost:5000";
      }
      
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!token) {
      alert("Please login first to delete products!");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      let errorMessage = "Failed to delete product";
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = "Authentication failed. Please login again.";
          localStorage.removeItem("token");
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = "Cannot connect to server. Please make sure the backend server is running on http://localhost:5000";
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f9fd]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6 text-blue-600">Manage Products</h1>

      <div className="mb-6 bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
        {!token && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            Please login to add products. <Link to="/auth" className="underline font-medium">Login here</Link>
          </div>
        )}
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <input 
              type="text" 
              placeholder="Product Title" 
              value={title} 
              onChange={(e)=>setTitle(e.target.value)} 
              className="border p-2 rounded"
              required
            />
            <input 
              type="number" 
              placeholder="Price (₹)" 
              value={price} 
              onChange={(e)=>setPrice(e.target.value)} 
              className="border p-2 rounded"
              required
              min="0"
              step="0.01"
            />
            <select
              value={category}
              onChange={(e)=>setCategory(e.target.value)}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Source (Optional - Amazon/Flipkart)" 
              value={source} 
              onChange={(e)=>setSource(e.target.value)} 
              className="border p-2 rounded"
            />
            <input 
              type="url" 
              placeholder="Image URL" 
              value={image} 
              onChange={(e)=>setImage(e.target.value)} 
              className="border p-2 rounded"
              required
            />
            <input 
              type="number" 
              placeholder="Rating (0-5)" 
              value={rating} 
              onChange={(e)=>setRating(e.target.value)} 
              min="0"
              max="5"
              step="0.1"
              className="border p-2 rounded"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={!token}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add Product
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-3 text-left">Image</th>
              <th className="border p-3 text-left">Title</th>
              <th className="border p-3 text-left">Category</th>
              <th className="border p-3 text-left">Price</th>
              <th className="border p-3 text-left">Rating</th>
              <th className="border p-3 text-left">Source</th>
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="border p-3">
                  {p.image ? (
                    <img src={p.image} alt={p.title} className="w-16 h-16 object-contain rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                      No Image
                    </div>
                  )}
                </td>
                <td className="border p-3 font-medium">{p.title}</td>
                <td className="border p-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {p.category || "Uncategorized"}
                  </span>
                </td>
                <td className="border p-3 text-blue-600 font-semibold">₹{p.price}</td>
                <td className="border p-3">
                  {p.rating ? (
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span>{p.rating}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="border p-3">{p.source}</td>
                <td className="border p-3">
                  <button 
                    onClick={()=>handleDelete(p._id)} 
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
