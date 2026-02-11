import { Link } from "react-router-dom";
import { Activity, Bot, Table2, Zap } from "lucide-react";
import { useBoards } from "../hooks/useBoards.ts";
import { useWorkspaceStore } from "../stores/workspace.ts";

export function DashboardPage() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { data: boardsData } = useBoards(currentWorkspace?.id);
  const boards = boardsData?.data ?? [];

  const stats = [
    {
      label: "Active Boards",
      value: String(boards.length),
      icon: Table2,
      color: "text-blue-400",
    },
    { label: "Open Items", value: "--", icon: Activity, color: "text-green-400" },
    { label: "Active Agents", value: "0", icon: Bot, color: "text-purple-400" },
    { label: "Automations", value: "0", icon: Zap, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-forge-text-muted mt-1">
          Overview of your workspace activity
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-forge-surface border border-forge-border rounded-lg p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-forge-text-muted">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon size={28} className={stat.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Boards list */}
      {boards.length > 0 && (
        <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Your Boards</h2>
          <div className="space-y-2">
            {boards.map((board) => (
              <Link
                key={board.id}
                to={`/boards/${board.id}`}
                className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-forge-surface-hover transition-colors"
              >
                <Table2 size={18} className="text-forge-accent" />
                <div>
                  <p className="text-sm font-medium">{board.name}</p>
                  {board.description && (
                    <p className="text-xs text-forge-text-muted">
                      {board.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity placeholder */}
      <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            "Sprint Planning Agent completed daily standup summary",
            "3 items moved to 'Done' in Bug Tracker",
            "New automation triggered: Client follow-up email sent",
            "AI generated risk assessment for 'Q2 Launch' board",
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2 border-b border-forge-border last:border-0"
            >
              <div className="w-2 h-2 mt-2 rounded-full bg-forge-accent shrink-0" />
              <p className="text-sm text-forge-text-muted">{activity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
