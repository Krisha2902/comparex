import {
  ComputerDesktopIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  HomeIcon,
  TruckIcon,
  BoltIcon,
  PuzzlePieceIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const iconMap = {
  ComputerDesktopIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  HomeIcon,
  TruckIcon,
  BoltIcon,
  PuzzlePieceIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
};

export default function CategoryCard({ name, icon }) {
  const Icon = iconMap[icon];

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#f5faff] border border-[#dbeafe] rounded-xl shadow-sm hover:shadow-md hover:scale-[1.03] transition">
      <Icon className="w-5 h-5 text-blue-500" />
      <span className="text-sm font-medium text-slate-700">
        {name}
      </span>
    </div>
  );
}
