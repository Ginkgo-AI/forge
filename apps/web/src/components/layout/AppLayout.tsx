import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.tsx";
import { AIChatPanel } from "./AIChatPanel.tsx";
import { MessageSquare, X, Menu } from "lucide-react";

export function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile by default */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-12 border-b border-forge-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md hover:bg-forge-surface-hover transition-colors lg:hidden"
            >
              <Menu size={18} className="text-forge-text-muted" />
            </button>
            <div className="text-sm text-forge-text-muted">
              {/* Breadcrumb will go here */}
            </div>
          </div>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors"
          >
            {chatOpen ? <X size={16} /> : <MessageSquare size={16} />}
            <span className="hidden sm:inline">{chatOpen ? "Close AI" : "Ask Forge AI"}</span>
          </button>
        </header>

        {/* Content area with optional chat panel */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-4 sm:p-6 min-w-0">
            <Outlet />
          </div>

          {/* AI Chat Panel — full width on mobile, fixed width on desktop */}
          {chatOpen && (
            <div className="fixed inset-0 z-40 lg:static lg:inset-auto lg:w-96 border-l border-forge-border shrink-0 bg-forge-surface">
              <AIChatPanel onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
