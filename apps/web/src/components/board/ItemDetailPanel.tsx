import { useState, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import type { Column } from "@forge/shared";
import { useItem, useUpdateItem, useAddItemUpdate } from "../../hooks/useItems.ts";
import { CellEditor } from "./CellEditor.tsx";

type ItemDetailPanelProps = {
  itemId: string;
  boardId: string;
  columns: Column[];
  onClose: () => void;
};

export function ItemDetailPanel({
  itemId,
  boardId,
  columns,
  onClose,
}: ItemDetailPanelProps) {
  const { data: itemData, isLoading } = useItem(itemId);
  const updateItem = useUpdateItem();
  const addUpdate = useAddItemUpdate();
  const [commentText, setCommentText] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const item = itemData?.data;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (item) setNameValue(item.name);
  }, [item]);

  function saveName() {
    if (!item || !nameValue.trim() || nameValue.trim() === item.name) {
      setEditingName(false);
      return;
    }
    updateItem.mutate({
      id: item.id,
      boardId,
      data: { name: nameValue.trim() },
    });
    setEditingName(false);
  }

  function handleAddComment() {
    if (!commentText.trim() || !item) return;
    addUpdate.mutate(
      { itemId: item.id, body: commentText.trim() },
      { onSuccess: () => setCommentText("") }
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-full sm:max-w-lg bg-forge-surface border-l border-forge-border h-full overflow-y-auto shadow-xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-forge-surface border-b border-forge-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold truncate">Item Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-forge-surface-hover transition-colors"
          >
            <X size={16} className="text-forge-text-muted" />
          </button>
        </div>

        {isLoading || !item ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-forge-text-muted" size={20} />
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Item name */}
            <div>
              {editingName ? (
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setNameValue(item.name);
                      setEditingName(false);
                    }
                  }}
                  className="w-full text-lg font-bold bg-transparent border border-forge-accent rounded px-2 py-1 focus:outline-none"
                />
              ) : (
                <h3
                  onClick={() => setEditingName(true)}
                  className="text-lg font-bold cursor-pointer hover:text-forge-accent transition-colors"
                >
                  {item.name}
                </h3>
              )}
            </div>

            {/* Column values */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-forge-text-muted uppercase tracking-wider">
                Fields
              </h4>
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center gap-3 py-1.5"
                >
                  <span className="text-sm text-forge-text-muted w-28 shrink-0">
                    {col.title}
                  </span>
                  <div className="flex-1">
                    <CellEditor
                      column={col}
                      item={item}
                      boardId={boardId}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Updates/Comments */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-forge-text-muted uppercase tracking-wider">
                Updates
              </h4>

              {/* Add comment */}
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  placeholder="Write an update..."
                  className="flex-1 bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addUpdate.isPending}
                  className="px-3 py-2 rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors disabled:opacity-50"
                >
                  {addUpdate.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>

              {/* Comments list */}
              {item.updates && item.updates.length > 0 ? (
                <div className="space-y-3">
                  {item.updates.map((update) => (
                    <div
                      key={update.id}
                      className="bg-forge-surface-hover rounded-md p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {update.authorId?.slice(0, 8) ?? "System"}
                        </span>
                        <span className="text-xs text-forge-text-muted">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{update.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-forge-text-muted">No updates yet</p>
              )}
            </div>

            {/* Metadata */}
            <div className="text-xs text-forge-text-muted space-y-1 pt-4 border-t border-forge-border">
              <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(item.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
