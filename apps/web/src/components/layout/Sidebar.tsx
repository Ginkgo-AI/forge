import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Table2,
  Bot,
  Settings,
  Plus,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Trash2,
  FileText,
} from "lucide-react";
import { useBoards, useDeleteBoard } from "../../hooks/useBoards.ts";
import { useWorkspaceStore } from "../../stores/workspace.ts";
import { CreateBoardModal } from "../boards/CreateBoardModal.tsx";
import { ConfirmDialog } from "../ui/ConfirmDialog.tsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Docs", href: "/docs", icon: FileText },
];

type SidebarProps = {
  onClose?: () => void;
};

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { data: boardsData, isLoading } = useBoards(currentWorkspace?.id);
  const boards = boardsData?.data ?? [];
  const deleteBoard = useDeleteBoard();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null);
  const [boardMenuId, setBoardMenuId] = useState<string | null>(null);

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
              onClick={onClose}
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
            <button
              onClick={() => setCreateModalOpen(true)}
              className="p-1 rounded hover:bg-forge-surface-hover transition-colors"
            >
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
                <div key={board.id} className="relative group/board">
                  <Link
                    to={`/boards/${board.id}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-forge-accent/15 text-forge-accent"
                        : "text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text"
                    }`}
                  >
                    <Table2 size={16} />
                    <span className="truncate flex-1">{board.name}</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBoardMenuId(boardMenuId === board.id ? null : board.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-forge-border transition-colors opacity-0 group-hover/board:opacity-100"
                  >
                    <MoreHorizontal size={14} className="text-forge-text-muted" />
                  </button>
                  {boardMenuId === board.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 bg-forge-surface border border-forge-border rounded-md shadow-lg py-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          setBoardMenuId(null);
                          setDeleteBoardId(board.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-forge-surface-hover transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete board
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </nav>

      {/* Bottom: Settings */}
      <div className="p-3 border-t border-forge-border">
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text transition-colors"
        >
          <Settings size={18} />
          Settings
        </Link>
      </div>
      <CreateBoardModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteBoardId}
        onClose={() => setDeleteBoardId(null)}
        onConfirm={() => {
          if (deleteBoardId) deleteBoard.mutate({ id: deleteBoardId });
        }}
        title="Delete Board"
        message="Are you sure you want to delete this board? All items will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </aside>
  );
}
