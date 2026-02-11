import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.tsx";
import { AIChatPanel } from "./AIChatPanel.tsx";
import { MessageSquare, X } from "lucide-react";

export function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 border-b border-forge-border flex items-center justify-between px-4 shrink-0">
          <div className="text-sm text-forge-text-muted">
            {/* Breadcrumb will go here */}
          </div>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors"
          >
            {chatOpen ? <X size={16} /> : <MessageSquare size={16} />}
            {chatOpen ? "Close AI" : "Ask Forge AI"}
          </button>
        </header>

        {/* Content area with optional chat panel */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>

          {/* AI Chat Panel */}
          {chatOpen && (
            <div className="w-96 border-l border-forge-border shrink-0">
              <AIChatPanel onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
