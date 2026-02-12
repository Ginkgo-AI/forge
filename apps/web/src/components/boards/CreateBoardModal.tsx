import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal.tsx";
import { useCreateBoard } from "../../hooks/useBoards.ts";
import { useWorkspaceStore } from "../../stores/workspace.ts";
import type { Board } from "@forge/shared";

type CreateBoardModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateBoardModal({ open, onClose }: CreateBoardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const createBoard = useCreateBoard();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !currentWorkspace) return;

    createBoard.mutate(
      {
        name: name.trim(),
        workspaceId: currentWorkspace.id,
        description: description.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          const board = (result as { data: Board }).data;
          setName("");
          setDescription("");
          onClose();
          navigate(`/boards/${board.id}`);
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Board">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Board name <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint Board, Project Tracker..."
            className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md text-forge-text-muted hover:bg-forge-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || createBoard.isPending}
            className="px-4 py-2 text-sm rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors disabled:opacity-50"
          >
            {createBoard.isPending ? "Creating..." : "Create Board"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
