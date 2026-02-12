import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  useAutomations,
  useUpdateAutomation,
  useDeleteAutomation,
} from "../hooks/useAutomations.ts";
import { CreateAutomationModal } from "../components/automations/CreateAutomationModal.tsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.tsx";
import type { Automation } from "@forge/shared";

const statusStyles = {
  active: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-amber-500/15 text-amber-400",
  disabled: "bg-gray-500/15 text-gray-400",
};

function formatTriggerType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function AutomationsPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: automationsData, isLoading } = useAutomations(boardId);
  const updateAutomation = useUpdateAutomation();
  const deleteAutomation = useDeleteAutomation();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);

  const automations = automationsData?.data ?? [];

  function handleToggleStatus(automation: Automation) {
    const newStatus = automation.status === "active" ? "paused" : "active";
    updateAutomation.mutate({
      id: automation.id,
      data: { status: newStatus },
    });
  }

  if (!boardId) {
    return (
      <div className="text-center py-12 text-forge-text-muted">
        No board selected
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-forge-text-muted mt-1">
            Automate workflows with "when X then Y" rules
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Create Automation
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-forge-text-muted">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading automations...
        </div>
      ) : automations.length === 0 ? (
        <div className="text-center py-12">
          <Zap size={48} className="mx-auto text-forge-text-muted mb-3" />
          <p className="text-forge-text-muted">No automations yet</p>
          <p className="text-sm text-forge-text-muted mt-1">
            Create an automation to run actions when events occur on this board
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="bg-forge-surface border border-forge-border rounded-lg p-4 hover:border-forge-accent/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Zap size={16} className="text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">
                        {automation.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          statusStyles[automation.status]
                        }`}
                      >
                        {automation.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-forge-text-muted">
                      <span>
                        Trigger: {formatTriggerType(automation.trigger.type)}
                      </span>
                      <span>
                        {automation.actions.length} action(s)
                      </span>
                      {automation.runCount > 0 && (
                        <span>{automation.runCount} runs</span>
                      )}
                      {automation.lastRunAt && (
                        <span>
                          Last:{" "}
                          {new Date(automation.lastRunAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-4">
                  <button
                    onClick={() => handleToggleStatus(automation)}
                    className="p-1.5 rounded-md hover:bg-forge-surface-hover transition-colors"
                    title={
                      automation.status === "active"
                        ? "Pause"
                        : "Activate"
                    }
                  >
                    {automation.status === "active" ? (
                      <Pause size={14} className="text-forge-text-muted" />
                    ) : (
                      <Play size={14} className="text-forge-text-muted" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(automation)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-forge-text-muted" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAutomationModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        boardId={boardId}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteAutomation.mutate({ id: deleteTarget.id });
            setDeleteTarget(null);
          }
        }}
        title="Delete Automation"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
