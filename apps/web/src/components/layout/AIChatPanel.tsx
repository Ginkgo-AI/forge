import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export function AIChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Forge AI. I can help you manage your boards, create items, analyze data, and run automations. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        role: "assistant",
        content:
          "AI chat integration coming in Phase 3. This will connect to Claude with tool-calling to manage your boards, items, and workflows.",
        timestamp: new Date(),
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-forge-surface">
      {/* Header */}
      <div className="h-12 flex items-center gap-2 px-4 border-b border-forge-border shrink-0">
        <Sparkles size={16} className="text-forge-accent" />
        <span className="text-sm font-medium">Forge AI</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-forge-accent text-white"
                  : "bg-forge-surface-hover text-forge-text"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-forge-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Forge AI anything..."
            className="flex-1 bg-forge-bg border border-forge-border rounded-md px-3 py-2 text-sm text-forge-text placeholder:text-forge-text-muted focus:outline-none focus:border-forge-accent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-md bg-forge-accent hover:bg-forge-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
