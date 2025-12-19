export default function TipCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition">
      
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4 text-xl">
        {icon}
      </div>

      <h3 className="font-semibold text-slate-800 mb-2">
        {title}
      </h3>

      <p className="text-sm text-slate-600">
        {description}
      </p>

    </div>
  );
}
