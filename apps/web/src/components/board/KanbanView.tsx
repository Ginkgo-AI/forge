import { useState } from "react";
import type { Column, Item, ColumnConfig } from "@forge/shared";
import { useUpdateItem } from "../../hooks/useItems.ts";

type KanbanViewProps = {
  columns: Column[];
  items: Item[];
  boardId: string;
  onItemClick: (itemId: string) => void;
};

const fallbackColors: Record<string, string> = {
  not_started: "#C4C4C4",
  working: "#FDAB3D",
  stuck: "#E2445C",
  done: "#00C875",
  high: "#E2445C",
  medium: "#FDAB3D",
  low: "#579BFC",
  critical: "#333333",
};

export function KanbanView({
  columns,
  items,
  boardId,
  onItemClick,
}: KanbanViewProps) {
  const updateItem = useUpdateItem();
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverLane, setDragOverLane] = useState<string | null>(null);

  // Find the first status column
  const statusColumn = columns.find((c) => c.type === "status");
  if (!statusColumn) {
    return (
      <div className="text-center py-16 text-forge-text-muted">
        No status column found. Add a status column to use Kanban view.
      </div>
    );
  }

  const labels = (statusColumn.config as ColumnConfig)?.labels ?? {};
  const laneKeys = Object.keys(labels);

  // Add an "unset" lane for items without a status
  const lanes = [
    { key: "__unset__", label: "No Status", color: "#888888" },
    ...laneKeys.map((key) => ({
      key,
      label: labels[key].label,
      color: labels[key].color || fallbackColors[key] || "#C4C4C4",
    })),
  ];

  function getItemsForLane(laneKey: string) {
    if (laneKey === "__unset__") {
      return items.filter(
        (item) =>
          !item.columnValues?.[statusColumn!.id] ||
          !laneKeys.includes(item.columnValues[statusColumn!.id] as string)
      );
    }
    return items.filter(
      (item) => item.columnValues?.[statusColumn!.id] === laneKey
    );
  }

  function handleDragStart(itemId: string) {
    setDragItemId(itemId);
  }

  function handleDragOver(e: React.DragEvent, laneKey: string) {
    e.preventDefault();
    setDragOverLane(laneKey);
  }

  function handleDragLeave() {
    setDragOverLane(null);
  }

  function handleDrop(laneKey: string) {
    if (!dragItemId || laneKey === "__unset__") {
      setDragItemId(null);
      setDragOverLane(null);
      return;
    }

    const item = items.find((i) => i.id === dragItemId);
    if (item && item.columnValues?.[statusColumn!.id] !== laneKey) {
      updateItem.mutate({
        id: item.id,
        boardId,
        data: {
          columnValues: { ...item.columnValues, [statusColumn!.id]: laneKey },
        },
      });
    }

    setDragItemId(null);
    setDragOverLane(null);
  }

  // Get a few key column values to show on the card
  const displayColumns = columns.filter(
    (c) => c.id !== statusColumn.id
  ).slice(0, 2);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {lanes.map((lane) => {
        const laneItems = getItemsForLane(lane.key);
        const isOver = dragOverLane === lane.key;

        return (
          <div
            key={lane.key}
            className={`flex-shrink-0 w-72 bg-forge-surface border border-forge-border rounded-lg flex flex-col ${
              isOver ? "ring-2 ring-forge-accent" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, lane.key)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(lane.key)}
          >
            {/* Lane header */}
            <div className="px-3 py-2.5 border-b border-forge-border flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: lane.color }}
              />
              <span className="text-sm font-medium truncate">
                {lane.label}
              </span>
              <span className="text-xs text-forge-text-muted ml-auto">
                {laneItems.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 min-h-[100px]">
              {laneItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onClick={() => onItemClick(item.id)}
                  className={`bg-forge-surface-hover border border-forge-border rounded-md p-3 cursor-pointer hover:border-forge-accent/50 transition-colors ${
                    dragItemId === item.id ? "opacity-50" : ""
                  }`}
                >
                  <p className="text-sm font-medium mb-1.5">{item.name}</p>
                  {displayColumns.map((col) => {
                    const val = item.columnValues?.[col.id];
                    if (!val) return null;
                    return (
                      <div
                        key={col.id}
                        className="text-xs text-forge-text-muted truncate"
                      >
                        <span className="font-medium">{col.title}:</span>{" "}
                        {String(val)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
