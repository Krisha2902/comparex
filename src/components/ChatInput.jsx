import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  return (
    <div className="flex gap-3 border-t p-4 bg-white">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask about products, prices, comparisons..."
        className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none"
      />

      <button
        onClick={handleSend}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
      >
        Send
      </button>
    </div>
  );
}
