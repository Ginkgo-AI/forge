import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Table2,
  Bot,
  Settings,
  Plus,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useBoards } from "../../hooks/useBoards.ts";
import { useWorkspaceStore } from "../../stores/workspace.ts";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Bot },
];

export function Sidebar() {
  const location = useLocation();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { data: boardsData, isLoading } = useBoards(currentWorkspace?.id);
  const boards = boardsData?.data ?? [];

  return (
    <aside className="w-60 bg-forge-surface border-r border-forge-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-12 flex items-center px-4 border-b border-forge-border">
        <span className="text-lg font-bold text-forge-accent">Forge</span>
        <span className="text-xs text-forge-text-muted ml-2 mt-0.5">AI Work Platform</span>
      </div>

      {/* Workspace selector */}
      <div className="p-3 border-b border-forge-border">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-forge-surface-hover text-sm hover:bg-forge-border transition-colors">
          <span className="truncate">
            {currentWorkspace?.name ?? "No Workspace"}
          </span>
          <ChevronDown size={14} className="text-forge-text-muted" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-forge-accent/15 text-forge-accent"
                  : "text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}

        {/* Boards section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-forge-text-muted uppercase tracking-wider">
              Boards
            </span>
            <button className="p-1 rounded hover:bg-forge-surface-hover transition-colors">
              <Plus size={14} className="text-forge-text-muted" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-forge-text-muted">
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </div>
          ) : boards.length === 0 ? (
            <div className="px-3 py-2 text-sm text-forge-text-muted">
              No boards yet
            </div>
          ) : (
            boards.map((board) => {
              const active = location.pathname === `/boards/${board.id}`;
              return (
                <Link
                  key={board.id}
                  to={`/boards/${board.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-forge-accent/15 text-forge-accent"
                      : "text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text"
                  }`}
                >
                  <Table2 size={16} />
                  <span className="truncate">{board.name}</span>
                </Link>
              );
            })
          )}
        </div>
      </nav>

      {/* Bottom: Settings */}
      <div className="p-3 border-t border-forge-border">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text transition-colors"
        >
          <Settings size={18} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
