import { useState } from "react";
import { Modal } from "../ui/Modal.tsx";
import { useCreateAgent } from "../../hooks/useAgents.ts";
import { useWorkspaceStore } from "../../stores/workspace.ts";

const AVAILABLE_TOOLS = [
  "list_boards",
  "get_board",
  "create_board",
  "add_column",
  "add_group",
  "list_items",
  "get_item",
  "create_item",
  "update_item",
  "delete_item",
  "add_item_update",
  "list_workspace_members",
];

type CreateAgentModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateAgentModal({ open, onClose }: CreateAgentModalProps) {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const createAgent = useCreateAgent();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [triggerType, setTriggerType] = useState<"manual" | "event">("manual");
  const [eventBoardId, setEventBoardId] = useState("");
  const [eventType, setEventType] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [maxActions, setMaxActions] = useState(10);

  function toggleTool(tool: string) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim() || !currentWorkspace) return;

    const triggers =
      triggerType === "manual"
        ? [{ type: "manual" as const, config: {} }]
        : [
            {
              type: "event" as const,
              config: {
                ...(eventBoardId ? { boardId: eventBoardId } : {}),
                ...(eventType ? { eventType } : {}),
              },
            },
          ];

    createAgent.mutate(
      {
        workspaceId: currentWorkspace.id,
        name: name.trim(),
        description: description.trim() || undefined,
        systemPrompt: systemPrompt.trim(),
        tools: selectedTools,
        triggers,
        guardrails: {
          requireApproval,
          maxActionsPerRun: maxActions,
        },
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setSystemPrompt("");
          setSelectedTools([]);
          setTriggerType("manual");
          setEventBoardId("");
          setEventType("");
          setRequireApproval(true);
          setMaxActions(10);
          onClose();
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Agent">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bug Triage Agent"
            className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this agent do?"
            className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            System Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are an agent that..."
            rows={4}
            className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent resize-none"
          />
        </div>

        {/* Tools */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Tools</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TOOLS.map((tool) => (
              <button
                key={tool}
                type="button"
                onClick={() => toggleTool(tool)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedTools.includes(tool)
                    ? "bg-forge-accent text-white"
                    : "bg-forge-surface-hover text-forge-text-muted hover:text-forge-text"
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Trigger</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTriggerType("manual")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                triggerType === "manual"
                  ? "bg-forge-accent text-white"
                  : "bg-forge-surface-hover text-forge-text-muted"
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setTriggerType("event")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                triggerType === "event"
                  ? "bg-forge-accent text-white"
                  : "bg-forge-surface-hover text-forge-text-muted"
              }`}
            >
              Event
            </button>
          </div>

          {triggerType === "event" && (
            <div className="mt-2 space-y-2">
              <input
                value={eventBoardId}
                onChange={(e) => setEventBoardId(e.target.value)}
                placeholder="Board ID (optional)"
                className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
              />
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-forge-surface border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
              >
                <option value="">Any event</option>
                <option value="item_created">Item Created</option>
                <option value="item_updated">Item Updated</option>
                <option value="column_value_changed">Column Value Changed</option>
                <option value="item_deleted">Item Deleted</option>
              </select>
            </div>
          )}
        </div>

        {/* Guardrails */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Guardrails</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="rounded border-forge-border"
              />
              Require approval before actions
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-forge-text-muted">
                Max actions per run:
              </label>
              <input
                type="number"
                value={maxActions}
                onChange={(e) => setMaxActions(Number(e.target.value))}
                min={1}
                max={100}
                className="w-20 bg-transparent border border-forge-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-forge-accent"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
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
            disabled={
              !name.trim() || !systemPrompt.trim() || createAgent.isPending
            }
            className="px-4 py-2 text-sm rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors disabled:opacity-50"
          >
            {createAgent.isPending ? "Creating..." : "Create Agent"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
