import { useTheme } from "../context/ThemeContext";

export default function DarkModeToggle() {
  const { dark, setDark } = useTheme();

  return (
    <button
      onClick={() => setDark(!dark)}
      className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
