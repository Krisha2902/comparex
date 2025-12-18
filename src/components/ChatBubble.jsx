export default function ChatBubble({ text, sender }) {
  const isUser = sender === "user";

  return (
    <div
      className={`max-w-[60%] px-4 py-2 rounded-xl text-sm ${
        isUser
          ? "bg-blue-600 text-white ml-auto"
          : "bg-white text-slate-700 shadow"
      }`}
    >
      {text}
    </div>
  );
}
