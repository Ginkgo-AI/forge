import { Table2, Activity, Bot, Zap } from "lucide-react";
import type { WorkspaceStats } from "../../hooks/useDashboard.ts";

type Props = {
  stats: WorkspaceStats | undefined;
  isLoading: boolean;
};

const cards = [
  { key: "totalBoards" as const, label: "Active Boards", icon: Table2, color: "text-blue-400" },
  { key: "totalItems" as const, label: "Open Items", icon: Activity, color: "text-green-400" },
  { key: "activeAgents" as const, label: "Active Agents", icon: Bot, color: "text-purple-400" },
  { key: "activeAutomations" as const, label: "Automations", icon: Zap, color: "text-orange-400" },
];

export function StatsGrid({ stats, isLoading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-forge-surface border border-forge-border rounded-lg p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-forge-text-muted">{card.label}</p>
              <p className="text-3xl font-bold mt-1">
                {isLoading ? (
                  <span className="inline-block w-10 h-8 bg-forge-border rounded animate-pulse" />
                ) : (
                  stats?.[card.key] ?? 0
                )}
              </p>
            </div>
            <card.icon size={28} className={card.color} />
          </div>
        </div>
      ))}
    </div>
  );
}
