import { Bot, Play, Pause, Plus, Clock, Zap } from "lucide-react";

const mockAgents = [
  {
    id: "agent_1",
    name: "Standup Bot",
    description: "Summarizes daily progress and blockers for each team member",
    status: "active" as const,
    trigger: "Daily at 9:00 AM",
    lastRun: "Today, 9:00 AM",
    runsToday: 1,
    tools: ["Read Boards", "Write Updates", "Send Slack"],
  },
  {
    id: "agent_2",
    name: "Bug Triage Agent",
    description: "Reads new bug reports, checks for duplicates, assigns severity",
    status: "active" as const,
    trigger: "New item in Bug Tracker",
    lastRun: "Today, 2:30 PM",
    runsToday: 4,
    tools: ["Read Boards", "Update Items", "Search"],
  },
  {
    id: "agent_3",
    name: "Weekly Report Generator",
    description: "Creates formatted status report with burndown and highlights",
    status: "paused" as const,
    trigger: "Every Friday at 5:00 PM",
    lastRun: "Last Friday, 5:00 PM",
    runsToday: 0,
    tools: ["Read Boards", "Generate Docs", "Send Email"],
  },
];

const statusStyles = {
  active: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-amber-500/15 text-amber-400",
  disabled: "bg-gray-500/15 text-gray-400",
};

export function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-forge-text-muted mt-1">
            Persistent AI agents that automate your workflows
          </p>
        </div>
        <button className="px-4 py-2 text-sm rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors flex items-center gap-2">
          <Plus size={16} />
          Create Agent
        </button>
      </div>

      <div className="grid gap-4">
        {mockAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-forge-surface border border-forge-border rounded-lg p-5 hover:border-forge-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-forge-accent/15 flex items-center justify-center shrink-0">
                  <Bot size={20} className="text-forge-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{agent.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[agent.status]}`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-sm text-forge-text-muted mt-1">
                    {agent.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-forge-text-muted">
                      <Clock size={12} />
                      <span>{agent.trigger}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-forge-text-muted">
                      <Zap size={12} />
                      <span>{agent.runsToday} runs today</span>
                    </div>
                  </div>

                  {/* Tools */}
                  <div className="flex items-center gap-2 mt-3">
                    {agent.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-0.5 rounded bg-forge-surface-hover text-xs text-forge-text-muted"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-md hover:bg-forge-surface-hover transition-colors">
                  {agent.status === "active" ? (
                    <Pause size={16} className="text-forge-text-muted" />
                  ) : (
                    <Play size={16} className="text-forge-text-muted" />
                  )}
                </button>
                <button className="px-3 py-1.5 text-sm rounded-md border border-forge-border hover:bg-forge-surface-hover transition-colors">
                  Run Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
