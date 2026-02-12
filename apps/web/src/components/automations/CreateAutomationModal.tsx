import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal.tsx";
import { useCreateAutomation } from "../../hooks/useAutomations.ts";

const TRIGGER_TYPES = [
  { value: "status_change", label: "Status Change" },
  { value: "column_change", label: "Column Change" },
  { value: "item_created", label: "Item Created" },
  { value: "item_deleted", label: "Item Deleted" },
];

const ACTION_TYPES = [
  { value: "change_column", label: "Change Column" },
  { value: "create_item", label: "Create Item" },
  { value: "move_item", label: "Move Item" },
  { value: "notify", label: "Notify (stub)" },
  { value: "ai_step", label: "AI Step" },
];

const CONDITION_OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

type ActionRow = {
  type: string;
  config: Record<string, unknown>;
};

type ConditionRow = {
  columnId: string;
  operator: string;
  value: string;
};

type CreateAutomationModalProps = {
  open: boolean;
  onClose: () => void;
  boardId: string;
};

export function CreateAutomationModal({
  open,
  onClose,
  boardId,
}: CreateAutomationModalProps) {
  const createAutomation = useCreateAutomation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("item_created");
  const [triggerColumnId, setTriggerColumnId] = useState("");
  const [triggerFromValue, setTriggerFromValue] = useState("");
  const [triggerToValue, setTriggerToValue] = useState("");
  const [conditions, setConditions] = useState<ConditionRow[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([
    { type: "change_column", config: {} },
  ]);

  const needsColumnConfig =
    triggerType === "status_change" || triggerType === "column_change";

  function addCondition() {
    setConditions([...conditions, { columnId: "", operator: "equals", value: "" }]);
  }

  function removeCondition(i: number) {
    setConditions(conditions.filter((_, idx) => idx !== i));
  }

  function updateCondition(i: number, updates: Partial<ConditionRow>) {
    setConditions(
      conditions.map((c, idx) => (idx === i ? { ...c, ...updates } : c))
    );
  }

  function addAction() {
    setActions([...actions, { type: "change_column", config: {} }]);
  }

  function removeAction(i: number) {
    if (actions.length <= 1) return;
    setActions(actions.filter((_, idx) => idx !== i));
  }

  function updateAction(
    i: number,
    updates: Partial<ActionRow>
  ) {
    setActions(
      actions.map((a, idx) => (idx === i ? { ...a, ...updates } : a))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !boardId) return;

    const triggerConfig: Record<string, unknown> = {};
    if (needsColumnConfig && triggerColumnId)
      triggerConfig.columnId = triggerColumnId;
    if (triggerType === "status_change") {
      if (triggerFromValue) triggerConfig.fromValue = triggerFromValue;
      if (triggerToValue) triggerConfig.toValue = triggerToValue;
    }

    createAutomation.mutate(
      {
        boardId,
        name: name.trim(),
        description: description.trim() || undefined,
        trigger: { type: triggerType, config: triggerConfig },
        conditions: conditions
          .filter((c) => c.columnId)
          .map((c) => ({
            columnId: c.columnId,
            operator: c.operator,
            value: c.value,
          })),
        actions: actions.map((a) => ({ type: a.type, config: a.config })),
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setTriggerType("item_created");
          setTriggerColumnId("");
          setTriggerFromValue("");
          setTriggerToValue("");
          setConditions([]);
          setActions([{ type: "change_column", config: {} }]);
          onClose();
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Automation">
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
            placeholder="e.g. When status changes to Done..."
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
            placeholder="What does this automation do?"
            className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
          />
        </div>

        {/* Trigger */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Trigger</label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="w-full bg-forge-surface border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
          >
            {TRIGGER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {needsColumnConfig && (
            <div className="mt-2 space-y-2">
              <input
                value={triggerColumnId}
                onChange={(e) => setTriggerColumnId(e.target.value)}
                placeholder="Column ID"
                className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
              />
              {triggerType === "status_change" && (
                <div className="flex gap-2">
                  <input
                    value={triggerFromValue}
                    onChange={(e) => setTriggerFromValue(e.target.value)}
                    placeholder="From value (optional)"
                    className="flex-1 bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
                  />
                  <input
                    value={triggerToValue}
                    onChange={(e) => setTriggerToValue(e.target.value)}
                    placeholder="To value (optional)"
                    className="flex-1 bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Conditions</label>
            <button
              type="button"
              onClick={addCondition}
              className="text-xs text-forge-accent hover:text-forge-accent-hover flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          {conditions.length === 0 && (
            <p className="text-xs text-forge-text-muted">
              No conditions — automation will always run when triggered
            </p>
          )}
          {conditions.map((cond, i) => (
            <div key={i} className="flex items-center gap-2 mt-2">
              <input
                value={cond.columnId}
                onChange={(e) => updateCondition(i, { columnId: e.target.value })}
                placeholder="Column ID"
                className="flex-1 bg-transparent border border-forge-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-forge-accent"
              />
              <select
                value={cond.operator}
                onChange={(e) =>
                  updateCondition(i, { operator: e.target.value })
                }
                className="bg-forge-surface border border-forge-border rounded-md px-2 py-1.5 text-xs"
              >
                {CONDITION_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              <input
                value={cond.value}
                onChange={(e) => updateCondition(i, { value: e.target.value })}
                placeholder="Value"
                className="flex-1 bg-transparent border border-forge-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-forge-accent"
              />
              <button
                type="button"
                onClick={() => removeCondition(i)}
                className="p-1 hover:bg-red-500/10 rounded"
              >
                <Trash2 size={12} className="text-forge-text-muted" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Actions</label>
            <button
              type="button"
              onClick={addAction}
              className="text-xs text-forge-accent hover:text-forge-accent-hover flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          {actions.map((action, i) => (
            <div
              key={i}
              className="mt-2 p-3 bg-forge-surface-hover rounded-md space-y-2"
            >
              <div className="flex items-center gap-2">
                <select
                  value={action.type}
                  onChange={(e) =>
                    updateAction(i, {
                      type: e.target.value,
                      config: {},
                    })
                  }
                  className="flex-1 bg-forge-surface border border-forge-border rounded-md px-2 py-1.5 text-xs"
                >
                  {ACTION_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
                {actions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAction(i)}
                    className="p-1 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 size={12} className="text-forge-text-muted" />
                  </button>
                )}
              </div>

              {/* Action config fields */}
              {(action.type === "change_column" ||
                action.type === "move_item") && (
                <div className="flex gap-2">
                  <input
                    value={(action.config.columnId as string) ?? ""}
                    onChange={(e) =>
                      updateAction(i, {
                        config: { ...action.config, columnId: e.target.value },
                      })
                    }
                    placeholder={
                      action.type === "move_item"
                        ? "Group ID"
                        : "Column ID"
                    }
                    className="flex-1 bg-transparent border border-forge-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-forge-accent"
                  />
                  <input
                    value={(action.config.value as string) ?? ""}
                    onChange={(e) =>
                      updateAction(i, {
                        config: { ...action.config, value: e.target.value },
                      })
                    }
                    placeholder={
                      action.type === "move_item"
                        ? "Group ID"
                        : "New value"
                    }
                    className="flex-1 bg-transparent border border-forge-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-forge-accent"
                  />
                </div>
              )}

              {action.type === "create_item" && (
                <div className="space-y-2">
                  <input
                    value={(action.config.groupId as string) ?? ""}
                    onChange={(e) =>
                      updateAction(i, {
                        config: { ...action.config, groupId: e.target.value },
                      })
                    }
                    placeholder="Group ID"
                    className="w-full bg-transparent border border-forge-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-forge-accent"
                  />
                  <input
                    value={(action.config.value as string) ?? ""}
                    onChange={(e) =>
                      updateAction(i, {
                        config: { ...action.config, value: e.target.value },
                      })
                    }
                    placeholder="Item name"
                    className="w-full bg-transparent border border-forge-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-forge-accent"
                  />
                </div>
              )}

              {action.type === "ai_step" && (
                <textarea
                  value={(action.config.aiPrompt as string) ?? ""}
                  onChange={(e) =>
                    updateAction(i, {
                      config: { ...action.config, aiPrompt: e.target.value },
                    })
                  }
                  placeholder="AI prompt..."
                  rows={2}
                  className="w-full bg-transparent border border-forge-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-forge-accent resize-none"
                />
              )}

              {action.type === "notify" && (
                <input
                  value={(action.config.message as string) ?? ""}
                  onChange={(e) =>
                    updateAction(i, {
                      config: { ...action.config, message: e.target.value },
                    })
                  }
                  placeholder="Notification message"
                  className="w-full bg-transparent border border-forge-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-forge-accent"
                />
              )}
            </div>
          ))}
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
            disabled={!name.trim() || createAutomation.isPending}
            className="px-4 py-2 text-sm rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors disabled:opacity-50"
          >
            {createAutomation.isPending ? "Creating..." : "Create Automation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
