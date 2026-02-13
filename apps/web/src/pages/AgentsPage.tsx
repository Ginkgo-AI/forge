import { useState } from "react";
import {
  Bot,
  Play,
  Pause,
  Plus,
  Clock,
  Zap,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useWorkspaceStore } from "../stores/workspace.ts";
import {
  useAgents,
  useUpdateAgent,
  useTriggerAgent,
  useDeleteAgent,
} from "../hooks/useAgents.ts";
import { CreateAgentModal } from "../components/agents/CreateAgentModal.tsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.tsx";
import type { Agent, AgentRun } from "@forge/shared";

const statusStyles = {
  active: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-amber-500/15 text-amber-400",
  disabled: "bg-gray-500/15 text-gray-400",
};

function formatTrigger(agent: Agent): string {
  if (!agent.triggers?.length) return "Manual";
  const trigger = agent.triggers[0];
  if (trigger.type === "manual") return "Manual";
  if (trigger.type === "event") {
    const eventType = trigger.config.eventType as string;
    return eventType
      ? `Event: ${eventType.replace(/_/g, " ")}`
      : "Event: any";
  }
  if (trigger.type === "schedule") return `Schedule: ${trigger.config.cron}`;
  return trigger.type;
}

function RunHistoryRow({ run }: { run: AgentRun }) {
  const statusColors: Record<string, string> = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    running: "text-blue-400",
    queued: "text-gray-400",
  };

  return (
    <div className="flex items-center justify-between py-1.5 text-xs text-forge-text-muted">
      <div className="flex items-center gap-2">
        <span className={statusColors[run.status] ?? "text-gray-400"}>
          {run.status}
        </span>
        <span>{run.toolCalls?.length ?? 0} tool call(s)</span>
      </div>
      <span>
        {run.createdAt
          ? new Date(run.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </span>
    </div>
  );
}

export function AgentsPage() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { data: agentsData, isLoading } = useAgents(currentWorkspace?.id);
  const updateAgent = useUpdateAgent();
  const triggerAgent = useTriggerAgent();
  const deleteAgent = useDeleteAgent();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

  const agents = (agentsData?.data ?? []) as Array<
    Agent & { runs?: AgentRun[] }
  >;

  function handleToggleStatus(agent: Agent) {
    const newStatus = agent.status === "active" ? "paused" : "active";
    updateAgent.mutate({ id: agent.id, data: { status: newStatus } });
  }

  function handleRunNow(agent: Agent) {
    setRunningIds((prev) => new Set(prev).add(agent.id));
    triggerAgent.mutate(
      { id: agent.id },
      {
        onSettled: () => {
          setRunningIds((prev) => {
            const next = new Set(prev);
            next.delete(agent.id);
            return next;
          });
        },
      }
    );
  }

  return (
    <div className="space-y-6" data-tour="agents-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-forge-text-muted mt-1">
            Persistent AI agents that automate your workflows
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Create Agent
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-forge-text-muted">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading agents...
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <Bot size={48} className="mx-auto text-forge-text-muted mb-3" />
          <p className="text-forge-text-muted">No agents yet</p>
          <p className="text-sm text-forge-text-muted mt-1">
            Create an agent to automate tasks in your workspace
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-forge-surface border border-forge-border rounded-lg p-5 hover:border-forge-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-forge-accent/15 flex items-center justify-center shrink-0">
                    <Bot size={20} className="text-forge-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold truncate">{agent.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          statusStyles[agent.status]
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    {agent.description && (
                      <p className="text-sm text-forge-text-muted mt-1 truncate">
                        {agent.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-forge-text-muted">
                        <Clock size={12} />
                        <span>{formatTrigger(agent)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-forge-text-muted">
                        <Zap size={12} />
                        <span>{agent.tools?.length ?? 0} tools</span>
                      </div>
                    </div>

                    {/* Tool badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {(agent.tools ?? []).slice(0, 6).map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 rounded bg-forge-surface-hover text-xs text-forge-text-muted"
                        >
                          {tool}
                        </span>
                      ))}
                      {(agent.tools?.length ?? 0) > 6 && (
                        <span className="text-xs text-forge-text-muted">
                          +{agent.tools.length - 6} more
                        </span>
                      )}
                    </div>

                    {/* Expandable run history */}
                    {(agent as Agent & { runs?: AgentRun[] }).runs &&
                      (agent as Agent & { runs?: AgentRun[] }).runs!.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === agent.id ? null : agent.id
                              )
                            }
                            className="flex items-center gap-1 text-xs text-forge-text-muted hover:text-forge-text transition-colors"
                          >
                            {expandedId === agent.id ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                            Recent runs
                          </button>
                          {expandedId === agent.id && (
                            <div className="mt-1 pl-4 border-l border-forge-border">
                              {(
                                agent as Agent & { runs?: AgentRun[] }
                              ).runs!.map((run) => (
                                <RunHistoryRow key={run.id} run={run} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleToggleStatus(agent)}
                    className="p-2 rounded-md hover:bg-forge-surface-hover transition-colors"
                    title={
                      agent.status === "active" ? "Pause agent" : "Activate agent"
                    }
                  >
                    {agent.status === "active" ? (
                      <Pause size={16} className="text-forge-text-muted" />
                    ) : (
                      <Play size={16} className="text-forge-text-muted" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRunNow(agent)}
                    disabled={runningIds.has(agent.id)}
                    className="px-3 py-1.5 text-sm rounded-md border border-forge-border hover:bg-forge-surface-hover transition-colors disabled:opacity-50"
                  >
                    {runningIds.has(agent.id) ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        Running
                      </span>
                    ) : (
                      "Run Now"
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(agent)}
                    className="p-2 rounded-md hover:bg-red-500/10 transition-colors"
                    title="Delete agent"
                  >
                    <Trash2 size={16} className="text-forge-text-muted" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAgentModal open={showCreate} onClose={() => setShowCreate(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteAgent.mutate({ id: deleteTarget.id });
            setDeleteTarget(null);
          }
        }}
        title="Delete Agent"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
