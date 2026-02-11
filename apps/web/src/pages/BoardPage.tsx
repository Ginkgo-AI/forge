import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Filter,
  SortAsc,
  LayoutGrid,
  Table,
  GanttChart,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  GripVertical,
  Loader2,
} from "lucide-react";
import { useBoard } from "../hooks/useBoards.ts";
import { useItems, useCreateItem } from "../hooks/useItems.ts";

const statusColors: Record<string, string> = {
  not_started: "bg-gray-500",
  working: "bg-amber-500",
  stuck: "bg-red-500",
  done: "bg-emerald-500",
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
  critical: "bg-gray-800",
};

export function BoardPage() {
  const { boardId } = useParams();
  const { data: boardData, isLoading: boardLoading } = useBoard(boardId);
  const { data: itemsData, isLoading: itemsLoading } = useItems(boardId);
  const createItem = useCreateItem();

  const [newItemName, setNewItemName] = useState("");
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);

  const board = boardData?.data;
  const allItems = itemsData?.data ?? [];
  const columns = board?.columns ?? [];
  const groups = board?.groups ?? [];

  if (boardLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-forge-text-muted" size={24} />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-16 text-forge-text-muted">
        Board not found
      </div>
    );
  }

  function getLabel(col: (typeof columns)[0], value: unknown): string {
    if (!value) return "-";
    const config = col.config as Record<string, unknown>;
    const labels = config?.labels as
      | Record<string, { label: string }>
      | undefined;
    if (labels && typeof value === "string" && labels[value]) {
      return labels[value].label;
    }
    return String(value);
  }

  function getStatusColor(col: (typeof columns)[0], value: unknown): string {
    if (!value || typeof value !== "string") return "bg-gray-500";
    return statusColors[value] ?? "bg-gray-500";
  }

  function handleAddItem(groupId: string) {
    if (!newItemName.trim() || !boardId) return;
    createItem.mutate(
      { boardId, groupId, name: newItemName.trim() },
      {
        onSuccess: () => {
          setNewItemName("");
          setAddingToGroup(null);
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      {/* Board header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{board.name}</h1>
          {board.description && (
            <p className="text-sm text-forge-text-muted mt-0.5">
              {board.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors flex items-center gap-1.5">
            <Plus size={14} />
            New Item
          </button>
        </div>
      </div>

      {/* View tabs & filters */}
      <div className="flex items-center justify-between border-b border-forge-border pb-3">
        <div className="flex items-center gap-1">
          {[
            { icon: Table, label: "Table", active: true },
            { icon: LayoutGrid, label: "Kanban", active: false },
            { icon: GanttChart, label: "Gantt", active: false },
            { icon: Calendar, label: "Calendar", active: false },
          ].map((view) => (
            <button
              key={view.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                view.active
                  ? "bg-forge-accent/15 text-forge-accent"
                  : "text-forge-text-muted hover:bg-forge-surface-hover"
              }`}
            >
              <view.icon size={14} />
              {view.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-forge-text-muted hover:bg-forge-surface-hover transition-colors">
            <Filter size={14} />
            Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-forge-text-muted hover:bg-forge-surface-hover transition-colors">
            <SortAsc size={14} />
            Sort
          </button>
        </div>
      </div>

      {/* Board table */}
      {groups.map((group) => {
        const groupItems = allItems.filter((i) => i.groupId === group.id);

        return (
          <div
            key={group.id}
            className="bg-forge-surface border border-forge-border rounded-lg overflow-hidden"
          >
            {/* Group header */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b border-forge-border"
              style={{ backgroundColor: `${group.color}15` }}
            >
              <ChevronDown size={14} style={{ color: group.color }} />
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: group.color }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: group.color }}
              >
                {group.title}
              </span>
              <span className="text-xs text-forge-text-muted">
                {groupItems.length} items
              </span>
            </div>

            {/* Column headers */}
            <div className="flex items-center border-b border-forge-border bg-forge-surface-hover">
              <div className="w-8 shrink-0" />
              <div className="flex-1 min-w-[250px] px-3 py-2 text-xs font-medium text-forge-text-muted uppercase tracking-wider">
                Item
              </div>
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="w-36 shrink-0 px-3 py-2 text-xs font-medium text-forge-text-muted uppercase tracking-wider"
                >
                  {col.title}
                </div>
              ))}
              <div className="w-10 shrink-0" />
            </div>

            {/* Items */}
            {groupItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center border-b border-forge-border last:border-0 hover:bg-forge-surface-hover/50 transition-colors group"
              >
                <div className="w-8 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical
                    size={14}
                    className="text-forge-text-muted cursor-grab"
                  />
                </div>
                <div className="flex-1 min-w-[250px] px-3 py-2.5 text-sm font-medium">
                  {item.name}
                </div>
                {columns.map((col) => {
                  const val = item.columnValues?.[col.id];
                  if (col.type === "status") {
                    return (
                      <div
                        key={col.id}
                        className="w-36 shrink-0 px-3 py-2.5"
                      >
                        {val ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-xs font-medium text-white ${getStatusColor(col, val)}`}
                          >
                            {getLabel(col, val)}
                          </span>
                        ) : (
                          <span className="text-sm text-forge-text-muted">
                            -
                          </span>
                        )}
                      </div>
                    );
                  }
                  if (col.type === "person") {
                    return (
                      <div
                        key={col.id}
                        className="w-36 shrink-0 px-3 py-2.5 text-sm text-forge-text-muted"
                      >
                        {val ? String(val).slice(0, 8) + "..." : "-"}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={col.id}
                      className="w-36 shrink-0 px-3 py-2.5 text-sm text-forge-text-muted"
                    >
                      {val != null ? String(val) : "-"}
                    </div>
                  );
                })}
                <div className="w-10 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 rounded hover:bg-forge-border transition-colors">
                    <MoreHorizontal
                      size={14}
                      className="text-forge-text-muted"
                    />
                  </button>
                </div>
              </div>
            ))}

            {/* Add item row */}
            {addingToGroup === group.id ? (
              <div className="flex items-center px-4 py-2 gap-2">
                <input
                  autoFocus
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem(group.id);
                    if (e.key === "Escape") {
                      setAddingToGroup(null);
                      setNewItemName("");
                    }
                  }}
                  placeholder="Item name"
                  className="flex-1 bg-transparent border border-forge-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-forge-accent"
                />
                <button
                  onClick={() => handleAddItem(group.id)}
                  disabled={createItem.isPending}
                  className="px-3 py-1.5 text-sm rounded bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors disabled:opacity-50"
                >
                  {createItem.isPending ? "Adding..." : "Add"}
                </button>
                <button
                  onClick={() => {
                    setAddingToGroup(null);
                    setNewItemName("");
                  }}
                  className="px-3 py-1.5 text-sm rounded text-forge-text-muted hover:bg-forge-surface-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div
                onClick={() => setAddingToGroup(group.id)}
                className="flex items-center px-4 py-2.5 text-forge-text-muted hover:bg-forge-surface-hover/50 cursor-pointer transition-colors"
              >
                <Plus size={14} className="mr-2" />
                <span className="text-sm">Add item</span>
              </div>
            )}
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="text-center py-16 text-forge-text-muted">
          No groups in this board yet
        </div>
      )}
    </div>
  );
}
