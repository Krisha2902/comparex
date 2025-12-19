import { WifiIcon } from "@heroicons/react/24/outline";

export default function NetworkLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-[#f3f9fd] flex flex-col items-center justify-center">
      
      {/* Animated WiFi Icon */}
      <div className="animate-pulse mb-4">
        <WifiIcon className="w-16 h-16 text-blue-600" />
      </div>

      {/* Text */}
      <h2 className="text-lg font-semibold text-slate-700">
        Checking your internet connection...
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        Please make sure you are connected 🌐
      </p>

      {/* Dots Animation */}
      <div className="flex gap-2 mt-4">
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></span>
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></span>
      </div>
    </div>
  );
}
