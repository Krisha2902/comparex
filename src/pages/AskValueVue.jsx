import { useState } from "react";
import Navbar from "../components/Navbar";
import ChatBubble from "../components/ChatBubble";
import ChatInput from "../components/ChatInput";
import { getBotReply } from "../data/botReplies";

export default function AskValueVue() {
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm ValueVue Assistant 🤖 How can I help you?",
      sender: "bot",
    },
  ]);

  const handleSend = (userMessage) => {
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);

    setTimeout(() => {
      const reply = getBotReply(userMessage);
      setMessages((prev) => [...prev, { text: reply, sender: "bot" }]);
    }, 600);
  };

  return (
    <>
      {/* NAVBAR */}
      <Navbar />

      {/* PAGE CONTENT */}
      <div className="px-6 py-8 bg-[#f3f9fd] min-h-screen">
        <h1 className="text-2xl font-semibold text-blue-600 mb-4">
          Ask ValueVue
        </h1>

        <div className="bg-white rounded-xl shadow-md flex flex-col h-[70vh]">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f7fbff]">
            {messages.map((msg, i) => (
              <ChatBubble key={i} text={msg.text} sender={msg.sender} />
            ))}
          </div>

          {/* Input */}
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </>
  );
}
