import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [source, setSource] = useState("");
  const [image, setImage] = useState("");
  const [rating, setRating] = useState("");

  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    try {
      // GET is public, no auth needed
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to load products");
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = async () => {
    if (!title || !price || !image || !rating) {
      alert("Please fill Title, Price, Image, and Rating fields");
      return;
    }
    try {
      const productData = {
        title: title.trim(),
        price: parseFloat(price),
        image: image.trim(),
        rating: parseFloat(rating),
      };
      
      // Add source only if provided
      if (source.trim()) {
        productData.source = source.trim();
      }

      const res = await axios.post(
        "http://localhost:5000/api/products",
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data) {
        alert("Product added successfully!");
        setTitle(""); setPrice(""); setSource(""); setImage(""); setRating("");
        fetchProducts();
      }
    } catch (error) {
      console.error("Error adding product:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to add product. Please check all fields.";
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
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
          />
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
            className="border p-2 rounded col-span-2"
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
          onClick={handleAdd} 
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-3 text-left">Image</th>
              <th className="border p-3 text-left">Title</th>
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
  );
}
