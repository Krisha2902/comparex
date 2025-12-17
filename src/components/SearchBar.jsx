import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    navigate(`/product?query=${encodeURIComponent(query)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center w-full"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="flex-1 outline-none text-sm"
      />

      <button type="submit">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 hover:text-blue-600" />
      </button>
    </form>
  );
}
