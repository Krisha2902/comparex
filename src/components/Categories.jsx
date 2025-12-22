import { categories } from "../data/categories";

export default function Categories({ selected, onSelect }) {
  return (
    <div className="flex gap-4 justify-center my-8">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-6 py-2 rounded-full border
            ${
              selected === cat.id
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
